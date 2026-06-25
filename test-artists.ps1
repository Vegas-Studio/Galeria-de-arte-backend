$loginBody = @{ email = 'ana@empresa.com'; password = '124789' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri 'http://localhost:3000/api/login' -Method POST -ContentType 'application/json' -Body $loginBody
$token = $loginRes.token
Write-Output "=== Token obtenido para rol: $($loginRes.user.role) ==="

$headers = @{ Authorization = "Bearer $token" }
try {
    $artists = Invoke-RestMethod -Uri 'http://localhost:3000/api/artists' -Method GET -Headers $headers
    Write-Output "=== Artistas encontrados: $($artists.Count) ==="
    $artists | ForEach-Object { Write-Output "  - $($_.full_name) [$($_.email)]" }
} catch {
    Write-Output "ERROR artistas: $_"
}
