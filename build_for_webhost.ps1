$ErrorActionPreference = "Stop"
$Workspace = "c:\Users\yomiy\Documents\Proyectos\Villy Car"
$DeployDir = "c:\Users\yomiy\Documents\Proyectos\Villy Car\webhost_deploy"

Set-Location $Workspace

Write-Host "Compilando frontend..."
npm run build

Write-Host "Limpiando/Creando carpeta webhost_deploy..."
if (Test-Path $DeployDir) {
    Remove-Item -Recurse -Force "$DeployDir\*"
} else {
    New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
}

Write-Host "Copiando archivos del frontend..."
Copy-Item -Path "dist\*" -Destination $DeployDir -Recurse -Force

Write-Host "Creando carpeta backend para el backend..."
New-Item -ItemType Directory -Force -Path "$DeployDir\backend" | Out-Null

Write-Host "Copiando archivos del backend..."
Copy-Item -Path "src\backend\api\*" -Destination "$DeployDir\backend" -Recurse -Force

Write-Host "Creando .htaccess para SPA..."
$HtaccessContent = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/backend/
  RewriteRule . /index.html [L]
</IfModule>
"@
Set-Content -Path "$DeployDir\.htaccess" -Value $HtaccessContent -Encoding Ascii

Write-Host "Configurando credenciales de la base de datos..."
$DbConfigFile = "$DeployDir\backend\db.php"
$content = Get-Content $DbConfigFile -Raw
$content = $content.Replace("`$host = '127.0.0.1';", "`$host = 'localhost';")
$content = $content.Replace("`$db   = 'villy_car_db';", "`$db   = 'villycar_base de datos';")
$content = $content.Replace("`$user = 'root';", "`$user = 'villycar_joel';")
$content = $content.Replace("`$pass = '';", "`$pass = 'FSKrY2w`$hi-w#TN^';")
Set-Content -Path $DbConfigFile -Value $content -Encoding Ascii

Write-Host "=========================================="
Write-Host "¡Carpeta webhost_deploy lista!"
Write-Host "=========================================="
