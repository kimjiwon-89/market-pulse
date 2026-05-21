param(
    [Parameter(Mandatory = $true)]
    [string]$Ec2Host,

    [string]$Ec2User = "ec2-user",

    [Parameter(Mandatory = $true)]
    [string]$KeyPath,

    [Parameter(Mandatory = $true)]
    [string]$RdsEndpoint,

    [string]$RdsDatabase = "marketpulse",

    [Parameter(Mandatory = $true)]
    [string]$RdsUser,

    [string]$LocalDumpPath = ".\marketpulse.dump",
    [string]$RemoteDumpPath = "~/marketpulse.dump"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    throw "scp was not found. Install OpenSSH client tools and add them to PATH."
}
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    throw "ssh was not found. Install OpenSSH client tools and add them to PATH."
}

$resolvedKey = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($KeyPath)
$resolvedDump = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($LocalDumpPath)

if (-not (Test-Path $resolvedDump)) {
    throw "Dump file not found: $resolvedDump"
}

$target = "${Ec2User}@${Ec2Host}"

Write-Host "Uploading dump to EC2: ${target}:$RemoteDumpPath"
scp -i $resolvedKey $resolvedDump "${target}:$RemoteDumpPath"

Write-Host "Restoring dump from EC2 to RDS: $RdsEndpoint/$RdsDatabase"
Write-Host "EC2 must have pg_restore installed and ~/.pgpass configured for the RDS endpoint."

$remoteCommand = "pg_restore --host $RdsEndpoint --port 5432 --username $RdsUser --dbname $RdsDatabase --clean --if-exists --no-owner --no-privileges $RemoteDumpPath"
ssh -i $resolvedKey $target $remoteCommand

Write-Host "Restore command finished."
