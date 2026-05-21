param(
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$Database = "marketpulse",
    [string]$User = "postgres",
    [string]$OutputPath = ".\marketpulse.dump"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    throw "pg_dump was not found. Install PostgreSQL client tools and add them to PATH."
}

$resolvedOutput = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$outputDir = Split-Path -Parent $resolvedOutput
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Write-Host "Exporting $Database from ${HostName}:$Port to $resolvedOutput"
pg_dump `
    --host $HostName `
    --port $Port `
    --username $User `
    --dbname $Database `
    --format custom `
    --file $resolvedOutput

Write-Host "Done: $resolvedOutput"

