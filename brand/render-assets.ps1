# Regenerates every raster brand asset from the HTML sources in this folder.
#
#   powershell -ExecutionPolicy Bypass -File brand/render-assets.ps1
#
# Needs Google Chrome (headless rendering) and Node (ICO packing). No image
# library, no npm packages. The sources are plain HTML so the artwork stays
# editable by anyone who can write CSS.

[CmdletBinding()]
param(
  [string]$Chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
)

$ErrorActionPreference = "Stop"
$brand = $PSScriptRoot
$repo = Split-Path $brand -Parent
$work = Join-Path ([System.IO.Path]::GetTempPath()) "scholars-hub-brand"

if (-not (Test-Path -LiteralPath $Chrome)) {
  throw "Chrome not found at '$Chrome'. Pass -Chrome <path to chrome.exe>."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "node is required to pack app/favicon.ico."
}

Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $work | Out-Null
$profile = Join-Path $work "profile"

# Chrome clamps the window to a minimum width, so small sizes cannot be
# screenshot directly: a 16x16 window is really a crop of a wider page. Every
# asset is rendered big and downsampled instead.
function Render {
  param([string]$Page, [int]$Width, [int]$Height, [string]$Out, [int]$Scale = 1, [string]$Background = "")

  if (Test-Path -LiteralPath $Out) { Remove-Item -LiteralPath $Out -Force }
  $arguments = @(
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--disable-extensions", "--user-data-dir=$profile",
    "--force-device-scale-factor=$Scale", "--window-size=$Width,$Height",
    "--virtual-time-budget=12000", "--screenshot=$Out"
  )
  if ($Background) { $arguments += "--default-background-color=$Background" }
  # file:/// + forward slashes: Chrome does not accept a Windows path here.
  $arguments += "file:///" + ((Join-Path $brand $Page) -replace '\\', '/')

  # Chrome reports "N bytes written" on stderr, and a native call that writes
  # to stderr becomes a terminating error while the preference is Stop.
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $Chrome @arguments 2>&1 | Out-Null
  } finally {
    $ErrorActionPreference = $previous
  }
  if (-not (Test-Path -LiteralPath $Out)) { throw "render failed: $Page -> $Out" }
}

function Resize {
  param([string]$Source, [int]$Size, [string]$Out)

  $image = [System.Drawing.Image]::FromFile($Source)
  try {
    # 32bppPArgb keeps alpha premultiplied, so edges do not pick up a pale
    # halo on dark backgrounds and opaque files stay fully opaque.
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppPArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $attributes = New-Object System.Drawing.Imaging.ImageAttributes
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      # Sample by mirroring the edge. Without this, GDI+ reads past the canvas
      # as transparent and erodes alpha along the border.
      $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
      $rectangle = New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)
      $graphics.DrawImage($image, $rectangle, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
    } finally {
      $graphics.Dispose()
      $attributes.Dispose()
    }
    $bitmap.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
  } finally {
    $image.Dispose()
  }
}

Write-Host "Rendering sources with headless Chrome..." -ForegroundColor Cyan
Render -Page "og.html"           -Width 1200 -Height 630  -Out (Join-Path $work "og.png")
Render -Page "mark-rounded.html" -Width 1024 -Height 1024 -Out (Join-Path $work "rounded.png")
Render -Page "mark-square.html"  -Width 1024 -Height 1024 -Out (Join-Path $work "square.png")
Render -Page "mark-compact.html" -Width 1024 -Height 1024 -Out (Join-Path $work "compact.png")
Render -Page "lockup.html"       -Width 720  -Height 180  -Out (Join-Path $work "lockup.png")      -Scale 2 -Background "00000000"
Render -Page "lockup-dark.html"  -Width 720  -Height 180  -Out (Join-Path $work "lockup-dark.png") -Scale 2 -Background "00000000"

Write-Host "Downsampling..." -ForegroundColor Cyan
Resize -Source (Join-Path $work "rounded.png") -Size 512 -Out (Join-Path $repo "public\brand\logo-mark-512.png")
Resize -Source (Join-Path $work "rounded.png") -Size 192 -Out (Join-Path $repo "public\brand\logo-mark-192.png")
Resize -Source (Join-Path $work "square.png")  -Size 512 -Out (Join-Path $repo "public\brand\logo-maskable-512.png")
Resize -Source (Join-Path $work "square.png")  -Size 180 -Out (Join-Path $repo "app\apple-icon.png")
Resize -Source (Join-Path $work "rounded.png") -Size 48  -Out (Join-Path $work "ico-48.png")
Resize -Source (Join-Path $work "compact.png") -Size 32  -Out (Join-Path $work "ico-32.png")
Resize -Source (Join-Path $work "compact.png") -Size 16  -Out (Join-Path $work "ico-16.png")

Copy-Item -LiteralPath (Join-Path $work "og.png") -Destination (Join-Path $repo "app\opengraph-image.png") -Force
Copy-Item -LiteralPath (Join-Path $work "og.png") -Destination (Join-Path $repo "app\twitter-image.png") -Force
Copy-Item -LiteralPath (Join-Path $work "lockup.png") -Destination (Join-Path $repo "public\brand\logo-lockup.png") -Force
Copy-Item -LiteralPath (Join-Path $work "lockup-dark.png") -Destination (Join-Path $repo "public\brand\logo-lockup-dark.png") -Force

Write-Host "Packing favicon.ico..." -ForegroundColor Cyan
& node (Join-Path $brand "make-ico.mjs") (Join-Path $repo "app\favicon.ico") `
  "16:$(Join-Path $work 'ico-16.png')" "32:$(Join-Path $work 'ico-32.png')" "48:$(Join-Path $work 'ico-48.png')"
if ($LASTEXITCODE -ne 0) { throw "make-ico.mjs failed" }

# The one invariant a raster pipeline silently breaks: iOS needs a square,
# fully opaque apple-touch-icon, and a resized rounded badge is not.
$apple = New-Object System.Drawing.Bitmap((Join-Path $repo "app\apple-icon.png"))
try {
  $transparent = 0
  for ($x = 0; $x -lt $apple.Width; $x += 1) {
    if ($apple.GetPixel($x, 0).A -ne 255 -or $apple.GetPixel($x, $apple.Height - 1).A -ne 255) { $transparent += 1 }
  }
  if ($transparent -gt 0) { throw "app/apple-icon.png has transparency on its edges; iOS will show the page behind it" }
} finally {
  $apple.Dispose()
}

Write-Host "`nAssets written:" -ForegroundColor Green
$outputs = @(
  "app\favicon.ico", "app\apple-icon.png", "app\opengraph-image.png", "app\twitter-image.png",
  "public\brand\logo-mark-192.png", "public\brand\logo-mark-512.png",
  "public\brand\logo-maskable-512.png", "public\brand\logo-lockup.png", "public\brand\logo-lockup-dark.png"
)
foreach ($file in $outputs) {
  $path = Join-Path $repo $file
  $image = [System.Drawing.Image]::FromFile($path)
  "{0,-42} {1,5}x{2,-5} {3,8} bytes" -f $file, $image.Width, $image.Height, (Get-Item -LiteralPath $path).Length
  $image.Dispose()
}

Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
