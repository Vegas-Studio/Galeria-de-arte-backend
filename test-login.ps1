$body = @{
    email = 'ana@empresa.com'
    password = '124789'
}
$json = $body | ConvertTo-Json
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:3000/api/login' -Method POST -ContentType 'application/json' -Body $json
    $r | ConvertTo-Json -Depth 3
} catch {
    Write-Output "ERROR: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
