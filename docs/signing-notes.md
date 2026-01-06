# Firma de Binarios

## Windows

- Usar `signtool` (parte de Windows SDK) o `osslsigncode`
- Certificado de firma de código (EV recomendado)
- Firmar EXE/MSI y validar con `signtool verify`

## macOS

- `codesign` con certificado Developer ID
- Notarizar con `xcrun altool` o `notarytool`
- Verificar con `spctl --assess --verbose`

## Linux

- AppImage: firma con `appimage signer` (si aplica)
- Paquetes deb/rpm: usar mecanismos nativos de firma
