param(
  [Parameter(Mandatory = $true)]
  [string]$Password,

  [string]$Username = '공무환경팀 김민현',

  [string]$BaseUrl = 'http://127.0.0.1:3100'
)

$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptRoot)
$seedScript = Join-Path $projectRoot 'src\\scripts\\seedMeteringSharedStore.js'

$env:KPI_OWNER_USERNAME = $Username
$env:KPI_OWNER_PASSWORD = $Password
$env:KPI_SERVER_BASE_URL = $BaseUrl

node $seedScript
