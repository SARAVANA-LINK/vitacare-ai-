$ErrorActionPreference = "Stop"

$tempFolder = Join-Path $env:TEMP "vitacare-ai-export"
$destZip = "d:\vitacare-ai-complete.zip"

Write-Host "Preparing export staging area at $tempFolder..."
if (Test-Path $tempFolder) {
    Remove-Item -Recurse -Force $tempFolder
}
New-Item -ItemType Directory -Path "$tempFolder\vitacare-ai" -Force | Out-Null

Write-Host "Copying project files (excluding node_modules, .git, dist)..."
& robocopy "d:\vitacare-ai" "$tempFolder\vitacare-ai" /E /XD node_modules .git dist /XF vitacare-ai-complete.zip create_zip.ps1
# robocopy returns exit codes 0-7 on success
if ($LASTEXITCODE -gt 7) {
    throw "Robocopy failed with code $LASTEXITCODE"
}

Write-Host "Compressing archive to $destZip..."
if (Test-Path $destZip) {
    Remove-Item -Force $destZip
}

Compress-Archive -Path "$tempFolder\vitacare-ai\*" -DestinationPath $destZip -Force

Write-Host "Cleaning up staging folder..."
Remove-Item -Recurse -Force $tempFolder

$zipItem = Get-Item $destZip
$sizeMb = [math]::Round($zipItem.Length / 1MB, 2)
Write-Host "SUCCESS! Archive created at: $($zipItem.FullName) ($sizeMb MB)"
