Param(
  [switch]$Debug
)

function Test-Command {
  param($Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) { Write-Error "Comando requerido no encontrado: $Name"; exit 1 }
}

Test-Command cargo
Test-Command rustc

$Repo = Split-Path -Parent $PSScriptRoot
$TauriDir = Join-Path $Repo 'src-tauri'
if (-not (Test-Path $TauriDir)) { Write-Error "src-tauri no existe"; exit 1 }

Push-Location $TauriDir
try {
  if ($Debug) { cargo tauri build --debug } else { cargo tauri build }
} finally { Pop-Location }

Write-Host "Binarios en: src-tauri/target/release/bundle/ (o debug)"
