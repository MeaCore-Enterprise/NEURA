function Test-Command { param($Name) if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Write-Error "Comando requerido no encontrado: $Name"; exit 1 } }

Test-Command cargo

$Repo = Split-Path -Parent $PSScriptRoot
$TauriDir = Join-Path $Repo 'src-tauri'
$PluginDir = Join-Path $Repo 'tauri-plugin-neura-audio'

if (-not (Test-Path $TauriDir)) { Write-Error "src-tauri no existe"; exit 1 }
if (-not (Test-Path $PluginDir)) { Write-Error "tauri-plugin-neura-audio no existe"; exit 1 }

$Main = Join-Path $TauriDir 'src\main.rs'
$CargoApp = Join-Path $TauriDir 'Cargo.toml'
$CargoPlugin = Join-Path $PluginDir 'Cargo.toml'

if (-not (Select-String -Path $Main -Pattern '\.plugin\(tauri_plugin_neura_audio::init\(\)\)')) { Write-Error "main.rs no registra el plugin"; exit 1 }
if (-not (Select-String -Path $CargoApp -Pattern 'tauri-plugin-neura-audio')) { Write-Error "Cargo.toml de app no declara el plugin"; exit 1 }
if (-not (Test-Path $CargoPlugin)) { Write-Error "Cargo.toml del plugin no encontrado"; exit 1 }

Push-Location $PluginDir; try { cargo check --quiet } catch { Write-Error "cargo check falló en plugin"; exit 1 } finally { Pop-Location }
Push-Location $TauriDir; try { cargo check --quiet } catch { Write-Error "cargo check falló en app"; exit 1 } finally { Pop-Location }

Write-Host "OK: Plugin nativo verificado"
