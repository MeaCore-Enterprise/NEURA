use anyhow::Result;
use crossbeam_channel::{bounded, Receiver, Sender};
use parking_lot::Mutex;
use rodio::{OutputStream, OutputStreamHandle, Sink};
use serde::{Deserialize, Serialize};
use std::{fs::File, io::BufReader, sync::Arc, time::{Duration, Instant}};
use symphonia::core::{
    audio::AudioBufferRef,
    codecs::DecoderOptions,
    formats::FormatOptions,
    io::MediaSourceStream,
    meta::MetadataOptions,
    probe::ProbeResult,
};
use symphonia::default::{get_codecs, get_probe};
use tauri::{AppHandle, Emitter, Manager};

// ── Eventos serializables ────────────────────────────────────────────────────

#[derive(Clone, Serialize)]
struct PositionEvent { position_ms: u64 }

#[derive(Clone, Serialize)]
struct StartedEvent { track: TrackInfo }

#[derive(Clone, Serialize)]
struct EndedEvent { track: TrackInfo }

#[derive(Clone, Serialize)]
struct ErrorEvent { code: String, message: String }

#[derive(Clone, Serialize)]
struct TrackInfo { id: String, uri: String, title: String, duration_ms: u64 }

// ── Args de comandos ─────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct LoadArgs { url: String, id: Option<String>, title: Option<String> }

#[derive(Deserialize)]
struct SeekArgs { position_ms: u64 }

#[derive(Deserialize)]
struct VolumeArgs { volume: f32 }

#[derive(Deserialize)]
struct FpsArgs { fps: u32 }

// ── Motor de audio ───────────────────────────────────────────────────────────

struct Engine {
    stream: Option<OutputStream>,
    handle: Option<OutputStreamHandle>,
    sink: Option<Sink>,
    samples: Vec<f32>,
    channels: u16,
    sample_rate: u32,
    duration_ms: u64,
    offset_ms: u64,
    started_at: Option<Instant>,
    paused_acc_ms: u64,
    track: Option<TrackInfo>,
    fps: u32,
    tx: Sender<EngineEvent>,
}

enum EngineEvent { Position(u64), Started, Ended, Error(String, String) }

impl Engine {
    fn new(fps: u32, tx: Sender<EngineEvent>) -> Self {
        Self {
            stream: None, handle: None, sink: None,
            samples: Vec::new(), channels: 2, sample_rate: 44100,
            duration_ms: 0, offset_ms: 0, started_at: None,
            paused_acc_ms: 0, track: None, fps, tx,
        }
    }

    fn ensure_output(&mut self) -> Result<()> {
        if self.handle.is_none() {
            let (stream, handle) = OutputStream::try_default()?;
            self.stream = Some(stream);
            self.handle = Some(handle);
        }
        if self.sink.is_none() {
            let sink = Sink::try_new(self.handle.as_ref().unwrap())?;
            self.sink = Some(sink);
        }
        Ok(())
    }

    fn decode_all(&mut self, path: &str) -> Result<()> {
        let file = File::open(path)?;
        let mss = MediaSourceStream::new(Box::new(file), Default::default());
        let probed: ProbeResult = get_probe().format(
            &FormatOptions::default(),
            &MetadataOptions::default(),
            mss,
            &Default::default(),
        )?;
        let mut format = probed.format;
        let track = format
            .default_track()
            .ok_or_else(|| anyhow::anyhow!("NO_TRACK"))?;
        let dec_opts = DecoderOptions { verify: false, ..Default::default() };
        let mut decoder = get_codecs().make(&track.codec_params, &dec_opts)?;
        self.channels = track.codec_params.channels.map(|c| c.count() as u16).unwrap_or(2);
        self.sample_rate = track.codec_params.sample_rate.unwrap_or(44100);
        self.samples.clear();

        loop {
            let packet = match format.next_packet() { Ok(p) => p, Err(_) => break };
            if packet.track_id() != track.id { continue; }
            let decoded = match decoder.decode(&packet) {
                Ok(d) => d,
                Err(err) => { if err.is_decode_error() { continue } else { break } }
            };
            match decoded {
                AudioBufferRef::F32(buf) => {
                    self.samples.extend_from_slice(buf.chan(0));
                    if self.channels > 1 { self.samples.extend_from_slice(buf.chan(1)); }
                }
                AudioBufferRef::U8(buf) => {
                    for ch in 0..self.channels.min(buf.channels().count() as u16) {
                        for s in buf.chan(ch as usize) { self.samples.push((*s as f32 - 128.0) / 128.0); }
                    }
                }
                AudioBufferRef::S16(buf) => {
                    for ch in 0..self.channels.min(buf.channels().count() as u16) {
                        for s in buf.chan(ch as usize) { self.samples.push(*s as f32 / 32768.0); }
                    }
                }
                AudioBufferRef::S24(buf) => {
                    for ch in 0..self.channels.min(buf.channels().count() as u16) {
                        for s in buf.chan(ch as usize) { self.samples.push(*s as f32 / 8_388_608.0); }
                    }
                }
                AudioBufferRef::S32(buf) => {
                    for ch in 0..self.channels.min(buf.channels().count() as u16) {
                        for s in buf.chan(ch as usize) { self.samples.push(*s as f32 / 2_147_483_648.0); }
                    }
                }
                AudioBufferRef::F64(buf) => {
                    for ch in 0..self.channels.min(buf.channels().count() as u16) {
                        for s in buf.chan(ch as usize) { self.samples.push(*s as f32); }
                    }
                }
                _ => {}
            }
        }

        let frames = self.samples.len() as u64 / self.channels as u64;
        self.duration_ms = (frames * 1000) / self.sample_rate as u64;
        Ok(())
    }

    fn append_from(&mut self, position_ms: u64) -> Result<()> {
        self.ensure_output()?;
        let start_frame = (position_ms * self.sample_rate as u64 / 1000) as usize;
        let channels = self.channels as usize;
        let start_index = start_frame * channels;
        let slice = if start_index >= self.samples.len() { &[] } else { &self.samples[start_index..] };
        let buf = rodio::buffer::SamplesBuffer::new(self.channels, self.sample_rate, slice.to_vec());
        self.sink.as_ref().unwrap().append(buf);
        self.offset_ms = position_ms;
        self.started_at = Some(Instant::now());
        self.paused_acc_ms = 0;
        Ok(())
    }

    fn position_now(&self) -> u64 {
        let base = self.offset_ms;
        let elapsed = self.started_at.map(|t| t.elapsed().as_millis() as u64).unwrap_or(0);
        (base + elapsed - self.paused_acc_ms).min(self.duration_ms)
    }
}

// ── Plugin entry point ───────────────────────────────────────────────────────

type EngineState = Arc<Mutex<Engine>>;

pub fn init() -> tauri::plugin::TauriPlugin<tauri::Wry> {
    tauri::plugin::Builder::<tauri::Wry>::new("neura_audio")
        .setup(|app, _| {
            let (tx, rx) = bounded::<EngineEvent>(256);
            let engine = Engine::new(60, tx.clone());
            let engine_arc: EngineState = Arc::new(Mutex::new(engine));

            // Clonar el Arc antes de moverlo al event loop
            let engine_for_loop = Arc::clone(&engine_arc);
            let engine_for_timer = Arc::clone(&engine_arc);

            app.manage(engine_arc);

            let app_handle = app.app_handle().clone();
            spawn_event_loop(app_handle, rx, engine_for_loop, engine_for_timer);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load, play, pause, resume, stop, seek, set_volume, configure_position_fps
        ])
        .build()
}

fn spawn_event_loop(
    app: AppHandle,
    rx: Receiver<EngineEvent>,
    engine_for_loop: EngineState,
    engine_for_timer: EngineState,
) {
    // Loop de eventos → emite al frontend
    let app_ev = app.clone();
    tauri::async_runtime::spawn(async move {
        loop {
            if let Ok(ev) = rx.recv() {
                match ev {
                    EngineEvent::Position(ms) => {
                        let _ = app_ev.emit("neura://audio/position", PositionEvent { position_ms: ms });
                    }
                    EngineEvent::Started => {
                        let track = engine_for_loop.lock().track.clone().unwrap_or(TrackInfo {
                            id: "unknown".into(), uri: "unknown".into(),
                            title: "unknown".into(), duration_ms: 0,
                        });
                        let _ = app_ev.emit("neura://audio/started", StartedEvent { track });
                    }
                    EngineEvent::Ended => {
                        let track = engine_for_loop.lock().track.clone().unwrap_or(TrackInfo {
                            id: "unknown".into(), uri: "unknown".into(),
                            title: "unknown".into(), duration_ms: 0,
                        });
                        let _ = app_ev.emit("neura://audio/ended", EndedEvent { track });
                    }
                    EngineEvent::Error(code, message) => {
                        let _ = app_ev.emit("neura://audio/error", ErrorEvent { code, message });
                    }
                }
            }
        }
    });

    // Timer de posición
    tauri::async_runtime::spawn(async move {
        let mut last = Instant::now();
        loop {
            tauri::async_runtime::sleep(Duration::from_millis(10)).await;
            let engine = engine_for_timer.lock();
            let fps = engine.fps.clamp(1, 60);
            let interval = Duration::from_millis(1000 / fps as u64);
            if last.elapsed() >= interval {
                last = Instant::now();
                let pos = engine.position_now();
                let _ = engine.tx.send(EngineEvent::Position(pos));
                if pos >= engine.duration_ms && engine.duration_ms > 0 {
                    let _ = engine.tx.send(EngineEvent::Ended);
                }
            }
        }
    });
}

// ── Comandos Tauri ───────────────────────────────────────────────────────────

#[tauri::command]
fn configure_position_fps(state: tauri::State<EngineState>, args: FpsArgs) -> Result<(), String> {
    state.lock().fps = args.fps.clamp(1, 60);
    Ok(())
}

#[tauri::command]
fn load(
    app: AppHandle,
    state: tauri::State<EngineState>,
    args: LoadArgs,
) -> Result<(), String> {
    let mut e = state.lock();

    // Resolver rutas app:// usando la API correcta de Tauri v2
    let path = if args.url.starts_with("app://assets/") {
        let rel = args.url.trim_start_matches("app://assets/");
        let base = app
            .path()
            .resource_dir()
            .map_err(|err| format!("RES_DIR_NOT_FOUND: {}", err))?;
        base.join(rel).to_string_lossy().to_string()
    } else {
        args.url.clone()
    };

    match e.decode_all(&path) {
        Ok(_) => {
            e.track = Some(TrackInfo {
                id: args.id.unwrap_or_else(|| path.clone()),
                uri: path.clone(),
                title: args.title.unwrap_or_else(|| path.clone()),
                duration_ms: e.duration_ms,
            });
            Ok(())
        }
        Err(err) => Err(format!("{}", err)),
    }
}

#[tauri::command]
fn play(state: tauri::State<EngineState>) -> Result<(), String> {
    let mut e = state.lock();
    if let Err(err) = e.append_from(0) { return Err(format!("{}", err)); }
    let _ = e.tx.send(EngineEvent::Started);
    Ok(())
}

#[tauri::command]
fn pause(state: tauri::State<EngineState>) -> Result<(), String> {
    let mut e = state.lock();
    if let Some(s) = &e.sink {
        s.pause();
        // Acumular tiempo pausado para position_now()
        if let Some(started) = e.started_at.take() {
            e.paused_acc_ms += started.elapsed().as_millis() as u64;
        }
    }
    Ok(())
}

#[tauri::command]
fn resume(state: tauri::State<EngineState>) -> Result<(), String> {
    let mut e = state.lock();
    if let Some(s) = &e.sink {
        s.play();
        e.started_at = Some(Instant::now());
    }
    Ok(())
}

#[tauri::command]
fn stop(state: tauri::State<EngineState>) -> Result<(), String> {
    let mut e = state.lock();
    if let Some(s) = e.sink.take() { s.stop(); }
    e.started_at = None;
    e.paused_acc_ms = 0;
    e.offset_ms = 0;
    Ok(())
}

#[tauri::command]
fn set_volume(state: tauri::State<EngineState>, args: VolumeArgs) -> Result<(), String> {
    let e = state.lock();
    let v = args.volume.clamp(0.0, 1.0);
    if let Some(s) = &e.sink { s.set_volume(v); }
    Ok(())
}

#[tauri::command]
fn seek(state: tauri::State<EngineState>, args: SeekArgs) -> Result<(), String> {
    let mut e = state.lock();
    if let Some(s) = e.sink.take() { s.stop(); }
    let pos = args.position_ms.min(e.duration_ms);
    if let Err(err) = e.append_from(pos) { return Err(format!("{}", err)); }
    let _ = e.tx.send(EngineEvent::Position(pos));
    Ok(())
}
