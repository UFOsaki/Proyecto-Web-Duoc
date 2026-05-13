# ============================================
# copy-frontend.ps1
# Sincroniza src/main/resources/static/ → docs/
# Ejecutar desde la raíz del proyecto:
#   .\scripts\copy-frontend.ps1
# ============================================

$source = "src\main\resources\static"
$dest = "docs"

# Limpiar docs/ (excepto .git si existiera)
if (Test-Path $dest) {
    Get-ChildItem -Path $dest -Recurse | Remove-Item -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $dest | Out-Null
}

# Copiar todo el frontend
Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force

Write-Host ""
Write-Host "Frontend sincronizado exitosamente:" -ForegroundColor Green
Write-Host "  Origen:  $source" -ForegroundColor Cyan
Write-Host "  Destino: $dest" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifica que docs/index.html existe y usa rutas relativas." -ForegroundColor Yellow
Write-Host "Luego haz commit y push para actualizar GitHub Pages." -ForegroundColor Yellow
