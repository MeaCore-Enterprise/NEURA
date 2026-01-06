#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  let ctx = tauri::generate_context!();
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_neura_audio::init());

  if let Err(e) = builder.run(ctx) {
    eprintln!("failed to start tauri app: {}", e);
  }
}
