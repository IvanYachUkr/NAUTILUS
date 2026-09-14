[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$PromptFile,

  [ValidateRange(1, 65535)]
  [int]$ProxyPort = 8931,

  [ValidateRange(1, 65535)]
  [int]$UpstreamPort = 8932,

  [ValidateRange(16, 8192)]
  [int]$MaxTurns = 1024,

  [string]$CdpEndpoint,

  [string]$TranscriptPath,

  [string]$AuditLogPath,

  [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
$packageRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$resolvedPrompt = (Resolve-Path -LiteralPath $PromptFile).Path
$resolvedAuditLogPath = $(if ([string]::IsNullOrWhiteSpace($AuditLogPath)) {
    $null
  } else {
    [System.IO.Path]::GetFullPath($AuditLogPath)
  })
$proxyUrl = "http://127.0.0.1:$ProxyPort/mcp"
$upstreamUrl = "http://127.0.0.1:$UpstreamPort/mcp"
$playwrightCli = Join-Path $packageRoot 'node_modules\@playwright\mcp\cli.js'
$proxyCli = Join-Path $packageRoot 'bin\openguessr-mcp.js'
$adapterScript = (Resolve-Path -LiteralPath (Join-Path $packageRoot 'browser\openguessr-adapter.js')).Path
$adapterInitPage = (Resolve-Path -LiteralPath (Join-Path $packageRoot 'browser\init-page.mjs')).Path

$connectionMode = 'extension'
if (-not [string]::IsNullOrWhiteSpace($CdpEndpoint)) {
  try {
    $cdpUri = [Uri]$CdpEndpoint
  } catch {
    throw "CdpEndpoint must be an absolute loopback HTTP URL."
  }
  if (
    -not $cdpUri.IsAbsoluteUri -or
    $cdpUri.Scheme -notin @('http', 'https') -or
    $cdpUri.DnsSafeHost -notin @('127.0.0.1', 'localhost', '::1') -or
    -not [string]::IsNullOrEmpty($cdpUri.UserInfo)
  ) {
    throw "CdpEndpoint must be an absolute loopback HTTP URL."
  }
  $CdpEndpoint = $cdpUri.AbsoluteUri.TrimEnd('/')
  $connectionMode = 'cdp'
}

$allowedMcpTools = @(
  'playwright__browser_take_screenshot',
  'playwright__browser_mouse_click_xy',
  'playwright__browser_mouse_move_xy',
  'playwright__browser_mouse_drag_xy',
  'playwright__browser_mouse_wheel',
  'playwright__browser_press_key',
  'playwright__openguessr_place_guess',
  'playwright__openguessr_get_state',
  'playwright__openguessr_submit_guess',
  'playwright__openguessr_continue'
)

$upstreamArgs = @($playwrightCli)
if ($connectionMode -eq 'cdp') {
  $upstreamArgs += @(
    "--cdp-endpoint=$CdpEndpoint",
    '--init-script', $adapterScript,
    '--init-page', $adapterInitPage,
    '--viewport-size', '1496x686',
    '--blocked-origins', 'https://sonic.impactify.media'
  )
} else {
  $upstreamArgs += @(
    '--extension',
    '--browser', 'chrome',
    '--init-script', $adapterScript,
    '--init-page', $adapterInitPage
  )
}
$upstreamArgs += @(
  '--caps=vision',
  '--snapshot-mode=none',
  '--image-responses=allow',
  '--codegen=none',
  '--timeout-action', '20000',
  '--shared-browser-context',
  '--host', '127.0.0.1',
  "--allowed-hosts=127.0.0.1:$UpstreamPort,localhost:$UpstreamPort",
  '--port', $UpstreamPort.ToString()
)
$proxyArgs = @(
  $proxyCli,
  '--host', '127.0.0.1',
  '--port', $ProxyPort.ToString(),
  '--upstream', $upstreamUrl
)
if ($null -ne $resolvedAuditLogPath) {
  $proxyArgs += @('--audit-log', $resolvedAuditLogPath)
}

function Assert-PortAvailable {
  param([int]$Port)
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  if ($listener) {
    throw "TCP port $Port is already in use."
  }
}

function Wait-ForTcpPort {
  param(
    [int]$Port,
    [System.Diagnostics.Process]$Process,
    [string]$ErrorLog
  )
  $deadline = [DateTime]::UtcNow.AddSeconds(30)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($Process.HasExited) {
      $detail = Get-Content -LiteralPath $ErrorLog -Raw -ErrorAction SilentlyContinue
      throw "Playwright MCP exited before port $Port opened. $detail"
    }
    $client = New-Object System.Net.Sockets.TcpClient
    try {
      $pending = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
      if ($pending.AsyncWaitHandle.WaitOne(250)) {
        $client.EndConnect($pending)
        return
      }
    } catch {
      # Retry until the bounded deadline.
    } finally {
      $client.Dispose()
    }
    Start-Sleep -Milliseconds 150
  }
  throw "Timed out waiting for Playwright MCP on port $Port."
}

function Wait-ForHealth {
  param(
    [string]$Uri,
    [System.Diagnostics.Process]$Process,
    [string]$ErrorLog
  )
  $deadline = [DateTime]::UtcNow.AddSeconds(20)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($Process.HasExited) {
      $detail = Get-Content -LiteralPath $ErrorLog -Raw -ErrorAction SilentlyContinue
      throw "OpenGuessr MCP exited before becoming healthy. $detail"
    }
    try {
      $health = Invoke-RestMethod -Uri $Uri -TimeoutSec 1
      if ($health.ok -eq $true) { return }
    } catch {
      # Retry until the bounded deadline.
    }
    Start-Sleep -Milliseconds 150
  }
  throw "Timed out waiting for OpenGuessr MCP health at $Uri."
}

function Quote-Arguments {
  param([string[]]$Arguments)
  return @($Arguments | ForEach-Object {
    if ($_ -match '[\s\"]') {
      '"' + $_.Replace('"', '\"') + '"'
    } else {
      $_
    }
  })
}

if ($ValidateOnly) {
  [ordered]@{
    browser = 'chrome'
    connectionMode = $connectionMode
    cdpEndpoint = $(if ($connectionMode -eq 'cdp') { $CdpEndpoint } else { $null })
    model = 'grok-4.6'
    reasoningEffort = 'xhigh'
    prompt = $resolvedPrompt
    auditLogPath = $resolvedAuditLogPath
    proxyUrl = $proxyUrl
    upstreamUrl = $upstreamUrl
    allowedMcpTools = $allowedMcpTools
    upstreamArgs = $upstreamArgs
    proxyArgs = $proxyArgs
    processesStarted = $false
  } | ConvertTo-Json -Depth 6
  exit 0
}

$nodeCommand = Get-Command node.exe -ErrorAction Stop
$grokCommand = Get-Command grok.exe -ErrorAction Stop
if (-not (Test-Path -LiteralPath $playwrightCli -PathType Leaf)) {
  throw "Playwright MCP is not installed. Run npm install in $packageRoot first."
}

$grokConfig = Join-Path $env:USERPROFILE '.grok\config.toml'
if (-not (Test-Path -LiteralPath $grokConfig -PathType Leaf)) {
  throw "Grok config was not found at $grokConfig."
}
$grokConfigText = Get-Content -LiteralPath $grokConfig -Raw
$proxyConfigured = $false
foreach ($configuredUrl in @($proxyUrl, "http://localhost:$ProxyPort/mcp")) {
  $escapedConfiguredUrl = [regex]::Escape($configuredUrl)
  if ($grokConfigText -match '(?ms)^\[mcp_servers\.playwright\].*?^url\s*=\s*[''\"]' + $escapedConfiguredUrl + '[''\"]') {
    $proxyConfigured = $true
    break
  }
}
if (-not $proxyConfigured) {
  throw "Configure [mcp_servers.playwright] with url = `"$proxyUrl`" before launching Grok."
}

$runtimeRoot = Join-Path $env:LOCALAPPDATA 'NAUTILUS-OpenGuessr-MCP'
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$upstreamOut = Join-Path $runtimeRoot "$stamp-playwright.stdout.log"
$upstreamErr = Join-Path $runtimeRoot "$stamp-playwright.stderr.log"
$proxyOut = Join-Path $runtimeRoot "$stamp-proxy.stdout.log"
$proxyErr = Join-Path $runtimeRoot "$stamp-proxy.stderr.log"

$upstreamProcess = $null
$proxyProcess = $null
$grokExitCode = 1
try {
  Assert-PortAvailable -Port $UpstreamPort
  Assert-PortAvailable -Port $ProxyPort

  $upstreamProcess = Start-Process -FilePath $nodeCommand.Source `
    -ArgumentList (Quote-Arguments $upstreamArgs) `
    -WorkingDirectory $packageRoot `
    -RedirectStandardOutput $upstreamOut `
    -RedirectStandardError $upstreamErr `
    -WindowStyle Hidden `
    -PassThru
  Wait-ForTcpPort -Port $UpstreamPort -Process $upstreamProcess -ErrorLog $upstreamErr

  $proxyProcess = Start-Process -FilePath $nodeCommand.Source `
    -ArgumentList (Quote-Arguments $proxyArgs) `
    -WorkingDirectory $packageRoot `
    -RedirectStandardOutput $proxyOut `
    -RedirectStandardError $proxyErr `
    -WindowStyle Hidden `
    -PassThru
  Wait-ForHealth -Uri "http://127.0.0.1:$ProxyPort/healthz" -Process $proxyProcess -ErrorLog $proxyErr

  $grokArgs = @(
    '--cwd', $runtimeRoot,
    '--model', 'grok-4.6',
    '--reasoning-effort', 'xhigh',
    '--prompt-file', $resolvedPrompt,
    '--verbatim',
    '--no-auto-update',
    '--output-format', 'plain',
    '--max-turns', $MaxTurns.ToString(),
    '--tools', 'search_tool,use_tool',
    '--disable-web-search',
    '--no-memory',
    '--no-subagents',
    '--no-plan',
    '--permission-mode', 'dontAsk',
    '--deny', 'Bash',
    '--deny', 'Grep',
    '--deny', 'Edit',
    '--deny', 'Write',
    '--deny', 'WebFetch',
    '--deny', 'WebSearch'
  )
  foreach ($tool in $allowedMcpTools) {
    $grokArgs += @('--allow', "MCPTool($tool)")
  }

  $ErrorActionPreference = 'Continue'
  if ([string]::IsNullOrWhiteSpace($TranscriptPath)) {
    & $grokCommand.Source @grokArgs
  } else {
    $transcriptFullPath = [System.IO.Path]::GetFullPath(
      $(if ([System.IO.Path]::IsPathRooted($TranscriptPath)) {
          $TranscriptPath
        } else {
          Join-Path (Get-Location) $TranscriptPath
        })
    )
    $transcriptDirectory = Split-Path -Parent $transcriptFullPath
    if ($transcriptDirectory) {
      New-Item -ItemType Directory -Force -Path $transcriptDirectory | Out-Null
    }
    & $grokCommand.Source @grokArgs 2>&1 | Tee-Object -FilePath $transcriptFullPath
  }
  $grokExitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = 'SilentlyContinue'
  foreach ($process in @($proxyProcess, $upstreamProcess)) {
    if ($null -ne $process -and -not $process.HasExited) {
      Stop-Process -Id $process.Id
      $process.WaitForExit(3000) | Out-Null
    }
  }
}

exit $grokExitCode
