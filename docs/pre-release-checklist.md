# Checklist Pre-Release NEURA Desktop

- [ ] Build Release `cargo tauri build`
- [ ] Binarios generados en `src-tauri/target/release/bundle/`
- [ ] Plugin nativo verificado (`scripts/verify-plugin`)
- [ ] Eventos `started/position/ended` recibidos en pruebas manuales
- [ ] `resolveAudioEngine()` selecciona Nativo cuando disponible
- [ ] Fallback a WebView/Mock verificado
- [ ] Assets de audio empaquetados (`app://assets/...`)
- [ ] Notas de versión y changelog
- [ ] Firma de binarios aplicada (ver `docs/signing-notes.md`)
