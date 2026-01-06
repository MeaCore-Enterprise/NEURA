use anyhow::Result;
use crossbeam_channel::{bounded, Receiver, Sender};
use parking_lot::Mutex;
use rodio::{OutputStream, OutputStreamHandle, Sink, Source};
use serde::{Deserialize, Serialize};
use std::{fs::File, io::BufReader, sync::Arc, time::{Duration, Instant}};
use symphonia::core::{audio::AudioBufferRef, codecs::DecoderOptions, formats::FormatOptions, io::MediaSourceStream, meta::MetadataOptions, probe::ProbeResult};
use symphonia::default::{codecs::Decoder, formats::FormatReader, get_codecs, get_probe};
use tauri::{AppHandle, Emitter};

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

#[derive(Deserialize)]
struct LoadArgs { url: String, id: Option<String>, title: Option<String> }

#[derive(Deserialize)]
struct SeekArgs { position_ms: u64 }

#[derive(Deserialize)]
struct VolumeArgs { volume: f32 }

#[derive(Deserialize)]
struct FpsArgs { fps: u32 }

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
    Self { stream: None, handle: None, sink: None, samples: Vec::new(), channels: 2, sample_rate: 44100, duration_ms: 0, offset_ms: 0, started_at: None, paused_acc_ms: 0, track: None, fps, tx }
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
    let probed: ProbeResult = get_probe().format(&FormatOptions::default(), &MetadataOptions::default(), mss, &Default::default())?;
    let mut format: Box<dyn FormatReader> = probed.format;
    let track = format.default_track().ok_or_else(|| anyhow::anyhow!("NO_TRACK"))?;
    let dec_opts = DecoderOptions { verify: false, ..Default::default() };
    let mut decoder: Box<dyn symphonia::core::codecs::Decoder> = get_codecs().make(&track.codec_params, &dec_opts)?;
    self.channels = track.codec_params.channels.map(|c| c.count() as u16).unwrap_or(2);
    self.sample_rate = track.codec_params.sample_rate.unwrap_or(44100);
    self.samples.clear();
    loop {
      let packet = match format.next_packet() { Ok(p) => p, Err(_) => break };
      if packet.track_id() != track.id { continue; }
      let decoded = match decoder.decode(&packet) { Ok(d) => d, Err(err) => { if err.is_decode_error() { continue } else { break } } };
      match decoded { AudioBufferRef::F32(buf) => { self.samples.extend_from_slice(buf.chan(0)); if self.channels > 1 { self.samples.extend_from_slice(buf.chan(1)); }},
        AudioBufferRef::U8(buf) => { for ch in 0..self.channels.min(buf.channels().count() as u16) { for s in buf.chan(ch as usize) { let v = (*s as f32 - 128.0)/128.0; self.samples.push(v); } } },
        AudioBufferRef::S16(buf) => { for ch in 0..self.channels.min(buf.channels().count() as u16) { for s in buf.chan(ch as usize) { let v = (*s as f32)/32768.0; self.samples.push(v); } } },
        AudioBufferRef::S24(buf) => { for ch in 0..self.channels.min(buf.channels().count() as u16) { for s in buf.chan(ch as usize) { let v = (*s as f32)/8388608.0; self.samples.push(v); } } },
        AudioBufferRef::S32(buf) => { for ch in 0..self.channels.min(buf.channels().count() as u16) { for s in buf.chan(ch as usize) { let v = (*s as f32)/2147483648.0; self.samples.push(v); } } },
        AudioBufferRef::F64(buf) => { for ch in 0..self.channels.min(buf.channels().count() as u16) { for s in buf.chan(ch as usize) { let v = *s as f32; self.samples.push(v); } } },
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
    let buf = rodio::buffer::SamplesBuffer::new(self.channels as u16, self.sample_rate, slice.to_vec());
    self.sink.as_ref().unwrap().append(buf);
    self.offset_ms = position_ms;
    self.started_at = Some(Instant::now());
    self.paused_acc_ms = 0;
    Ok(())
  }

  fn position_now(&self) -> u64 {
    let base = self.offset_ms;
    let elapsed = self.started_at.map(|t| t.elapsed().as_millis() as u64).unwrap_or(0);
    let pos = base + elapsed - self.paused_acc_ms;
    pos.min(self.duration_ms)
  }
}

struct SharedEngine {
  inner: Arc<Mutex<Engine>>,
  rx: Receiver<EngineEvent>,
}

pub fn init() -> tauri::plugin::TauriPlugin<()> {
  tauri::plugin::Builder::new("neura_audio")
    .setup(|app| {
      let (tx, rx) = bounded::<EngineEvent>(256);
      let engine = Engine::new(60, tx.clone());
      let shared = SharedEngine { inner: Arc::new(Mutex::new(engine)), rx };
      spawn_event_loop(app.app_handle().clone(), shared);
      app.manage(shared.inner.clone());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![load, play, pause, resume, stop, seek, set_volume, configure_position_fps])
    .build()
}

fn spawn_event_loop(app: AppHandle, shared: SharedEngine) {
  tauri::async_runtime::spawn(async move {
    loop {
      if let Ok(ev) = shared.rx.recv() {
        match ev {
          EngineEvent::Position(ms) => { let _ = app.emit_all("neura://audio/position", PositionEvent { position_ms: ms }); },
          EngineEvent::Started => {
            let track = shared.inner.lock().track.clone().unwrap_or(TrackInfo { id: "unknown".into(), uri: "unknown".into(), title: "unknown".into(), duration_ms: 0 });
            let _ = app.emit_all("neura://audio/started", StartedEvent { track });
          },
          EngineEvent::Ended => {
            let track = shared.inner.lock().track.clone().unwrap_or(TrackInfo { id: "unknown".into(), uri: "unknown".into(), title: "unknown".into(), duration_ms: 0 });
            let _ = app.emit_all("neura://audio/ended", EndedEvent { track });
          },
          EngineEvent::Error(code, message) => { let _ = app.emit_all("neura://audio/error", ErrorEvent { code, message }); },
        }
      }
    }
  });
  tauri::async_runtime::spawn(async move {
    let mut last = Instant::now();
    loop {
      tauri::async_runtime::sleep(Duration::from_millis(10)).await;
      let engine = shared.inner.lock();
      let fps = engine.fps.max(1).min(60);
      let interval = Duration::from_millis((1000 / fps) as u64);
      if last.elapsed() >= interval {
        last = Instant::now();
        let pos = engine.position_now();
        let _ = engine.tx.send(EngineEvent::Position(pos));
        if pos >= engine.duration_ms { let _ = engine.tx.send(EngineEvent::Ended); }
      }
    }
  });
}

#[tauri::command]
fn configure_position_fps(state: tauri::State<Arc<Mutex<Engine>>>, args: FpsArgs) -> Result<(), String> {
  let mut e = state.lock();
  e.fps = args.fps.min(60).max(1);
  Ok(())
}

#[tauri::command]
fn load(state: tauri::State<Arc<Mutex<Engine>>>, args: LoadArgs) -> Result<(), String> {
  let mut e = state.lock();
  let path = if args.url.starts_with("app://assets/") {
    let rel = args.url.trim_start_matches("app://assets/");
    let base = tauri::api::path::resource_dir().ok_or_else(|| "RES_DIR_NOT_FOUND".to_string())?;
    let p = base.join(rel);
    p.to_string_lossy().to_string()
  } else { args.url.clone() };
  match e.decode_all(&path) {
    Ok(_) => {
      e.track = Some(TrackInfo { id: args.id.unwrap_or_else(|| path.clone()), uri: path.clone(), title: args.title.unwrap_or_else(|| path.clone()), duration_ms: e.duration_ms });
      Ok(())
    }
    Err(err) => Err(format!("{}", err))
  }
}

#[tauri::command]
fn play(state: tauri::State<Arc<Mutex<Engine>>>) -> Result<(), String> {
  let mut e = state.lock();
  if let Err(err) = e.append_from(0) { return Err(format!("{}", err)); }
  let _ = e.tx.send(EngineEvent::Started);
  Ok(())
}

#[tauri::command]
fn pause(state: tauri::State<Arc<Mutex<Engine>>>) -> Result<(), String> {
  let mut e = state.lock();
  if let Some(s) = &e.sink { s.pause(); }
  Ok(())
}

#[tauri::command]
fn resume(state: tauri::State<Arc<Mutex<Engine>>>) -> Result<(), String> {
  let mut e = state.lock();
  if let Some(s) = &e.sink { s.play(); }
  Ok(())
}

#[tauri::command]
fn stop(state: tauri::State<Arc<Mutex<Engine>>>) -> Result<(), String> {
  let mut e = state.lock();
  if let Some(s) = e.sink.take() { s.stop(); }
  Ok(())
}

#[tauri::command]
fn set_volume(state: tauri::State<Arc<Mutex<Engine>>>, args: VolumeArgs) -> Result<(), String> {
  let mut e = state.lock();
  let v = args.volume.clamp(0.0, 1.0);
  if let Some(s) = &e.sink { s.set_volume(v); }
  Ok(())
}

#[tauri::command]
fn seek(state: tauri::State<Arc<Mutex<Engine>>>, args: SeekArgs) -> Result<(), String> {
  let mut e = state.lock();
  if let Some(s) = e.sink.take() { s.stop(); }
  if let Err(err) = e.append_from(args.position_ms.min(e.duration_ms)) { return Err(format!("{}", err)); }
  let _ = e.tx.send(EngineEvent::Position(args.position_ms));
  Ok(())
}
