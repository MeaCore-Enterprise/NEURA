Param(
  [switch]$SkipBuild
)

function Test-Command {
  param($Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Write-Error "Comando requerido no encontrado: $Name"; exit 1 }
}

Test-Command cargo
Test-Command rustc
Test-Command node
Test-Command npm

try { & cargo tauri -V | Out-Null } catch { Write-Error "Tauri CLI no disponible. Instalar: cargo install tauri-cli --version ^2"; exit 1 }
if ($LASTEXITCODE -ne 0) { Write-Error "Tauri CLI no disponible. Instalar: cargo install tauri-cli --version ^2"; exit 1 }

$Repo = Split-Path -Parent $PSScriptRoot
$TauriDir = Join-Path $Repo 'src-tauri'
if (-not (Test-Path $TauriDir)) { Write-Error "src-tauri no existe"; exit 1 }

$Main = Join-Path $TauriDir 'src\main.rs'
if (-not (Select-String -Path $Main -Pattern '\.plugin\(tauri_plugin_neura_audio::init\(\)\)')) { Write-Error "Plugin nativo no registrado en main.rs"; exit 1 }

Push-Location $Repo
try {
  if (-not (Test-Path (Join-Path $Repo 'node_modules'))) { npm install | Out-Null }
  if (-not $SkipBuild) { npm run build | Out-Null }
} finally { Pop-Location }

$npmCmd = (Get-Command npm -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) { $npmCmd = 'npm.cmd' }
$uiProc = Start-Process -FilePath $npmCmd -ArgumentList @('run','ui:dev') -WorkingDirectory $Repo -PassThru

$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  try { Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { Start-Sleep -Seconds 1 }
}

Push-Location $TauriDir
try { cargo tauri dev } finally { Pop-Location }

try { if ($uiProc -and -not $uiProc.HasExited) { Stop-Process -Id $uiProc.Id -Force } } catch {}
