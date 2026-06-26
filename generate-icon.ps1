# Generates a football-themed ICO icon (navy background + soccer ball + trophy accents)
# Non-trademarked. Uses System.Drawing.
# Output: worldcup-icon.ico

Add-Type -AssemblyName System.Drawing

$outPath = Join-Path $PSScriptRoot "worldcup-icon.ico"

# Work at 256x256 for a crisp high-res source, then embed multiple sizes
$srcSize = 256
$bmp = New-Object System.Drawing.Bitmap($srcSize, $srcSize)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# --- Background: rounded navy gradient (project color #1a1a2e) ---
$bgRect = New-Object System.Drawing.Rectangle(0, 0, $srcSize, $srcSize)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bgRect,
    ([System.Drawing.ColorTranslator]::FromHtml("#1a1a2e")),
    ([System.Drawing.ColorTranslator]::FromHtml("#2d2d52")),
    90
)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$r = 48  # corner radius
$path.AddArc(0, 0, $r, $r, 180, 90)
$path.AddArc($srcSize - $r, 0, $r, $r, 270, 90)
$path.AddArc($srcSize - $r, $srcSize - $r, $r, $r, 0, 90)
$path.AddArc(0, $srcSize - $r, $r, $r, 90, 90)
$path.CloseFigure()
$g.FillPath($bgBrush, $path)

# --- Soccer ball (white circle with navy pentagons) ---
$ballCx = 128
$ballCy = 118
$ballR = 58

# Ball shadow
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 0, 0, 0))
$g.FillEllipse($shadowBrush, ($ballCx - $ballR + 4), ($ballCy - $ballR + 6), ($ballR * 2), ($ballR * 2))

# Ball base
$ballRect = New-Object System.Drawing.Rectangle(($ballCx - $ballR), ($ballCy - $ballR), ($ballR * 2), ($ballR * 2))
$ballGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $ballRect,
    ([System.Drawing.Color]::White),
    ([System.Drawing.ColorTranslator]::FromHtml("#e2e8f0")),
    90
)
$g.FillEllipse($ballGrad, $ballRect)

# Ball outline
$ballPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#1a1a2e"), 3)
$g.DrawEllipse($ballPen, $ballRect)

# Center pentagon (navy)
$navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#1a1a2e"))
$centerPent = New-Object System.Drawing.Drawing2D.GraphicsPath
$pentR = 18
for ($i = 0; $i -lt 5; $i++) {
    $angle = (-[Math]::PI / 2) + ($i * (2 * [Math]::PI / 5))
    $px = $ballCx + $pentR * [Math]::Cos($angle)
    $py = $ballCy + $pentR * [Math]::Sin($angle)
    if ($i -eq 0) { $centerPent.AddLine($px, $py, $px, $py) }
    else { $centerPent.AddLine($centerPent.PathPoints[$i-1].X, $centerPent.PathPoints[$i-1].Y, $px, $py) }
}
$centerPent.CloseFigure()
# Simpler: draw a small filled pentagon manually
$pts = @()
for ($i = 0; $i -lt 5; $i++) {
    $angle = (-[Math]::PI / 2) + ($i * (2 * [Math]::PI / 5))
    $px = $ballCx + $pentR * [Math]::Cos($angle)
    $py = $ballCy + $pentR * [Math]::Sin($angle)
    $pts += (New-Object System.Drawing.PointF($px, $py))
}
$g.FillPolygon($navyBrush, $pts)

# Pentagon seams radiating outward
$seamPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#1a1a2e"), 2.5)
for ($i = 0; $i -lt 5; $i++) {
    $angle = (-[Math]::PI / 2) + ($i * (2 * [Math]::PI / 5))
    $x1 = $ballCx + $pentR * [Math]::Cos($angle)
    $y1 = $ballCy + $pentR * [Math]::Sin($angle)
    $x2 = $ballCx + ($ballR - 4) * [Math]::Cos($angle)
    $y2 = $ballCy + ($ballR - 4) * [Math]::Sin($angle)
    $g.DrawLine($seamPen, $x1, $y1, $x2, $y2)
}

# --- Trophy cup below the ball (gold) ---
$goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#d69e2e"))
$goldDark = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#b7791f"))

# Cup body
$cupTop = 180
$cupPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$cupPath.AddBezier(98, $cupTop, 100, 226, 156, 226, 158, $cupTop)
$cupPath.AddLine(158, $cupTop, 98, $cupTop)
$cupPath.CloseFigure()
$g.FillPath($goldBrush, $cupPath)

# Cup handles
$handlePen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml("#d69e2e"), 6)
$g.DrawArc($handlePen, 78, 184, 26, 30, 90, 180)
$g.DrawArc($handlePen, 152, 184, 26, 30, 270, 180)

# Cup base
$g.FillRectangle($goldDark, 116, 226, 24, 8)
$g.FillRectangle($goldBrush, 104, 234, 48, 8)

# --- "2026" text on base plate ---
$g.Dispose()

# Convert bitmap to icon with multiple sizes (ICO format)
$sizes = @(256, 64, 48, 32, 16)
$ms = New-Object System.IO.MemoryStream

# Write ICO header
$writer = New-Object System.IO.BinaryWriter($ms)
$count = $sizes.Count
$writer.Write([UInt16]0)       # reserved
$writer.Write([UInt16]1)       # type (icon)
$writer.Write([UInt16]$count)  # image count

# Reserve directory entries (8 bytes each), image data follows
$dataOffset = 6 + ($count * 16)
$images = @()

foreach ($size in $sizes) {
    $resized = New-Object System.Drawing.Bitmap($size, $size)
    $rg = [System.Drawing.Graphics]::FromImage($resized)
    $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $rg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $rg.DrawImage($bmp, 0, 0, $size, $size)
    $rg.Dispose()

    $pngMs = New-Object System.IO.MemoryStream
    $resized.Save($pngMs, [System.Drawing.Imaging.ImageFormat]::Png)
    $imgBytes = $pngMs.ToArray()
    $pngMs.Dispose()
    $resized.Dispose()
    $images += ,($imgBytes)

    $w = if ($size -ge 256) { 0 } else { $size }
    $h = $w
    $writer.Write([Byte]$w)             # width
    $writer.Write([Byte]$h)             # height
    $writer.Write([Byte]0)              # color count
    $writer.Write([Byte]0)              # reserved
    $writer.Write([UInt16]1)            # planes
    $writer.Write([UInt16]32)           # bits per pixel
    $writer.Write([UInt32]$imgBytes.Length)  # size
    $writer.Write([UInt32]$dataOffset)  # offset
    $dataOffset += $imgBytes.Length
}

# Write image data
foreach ($imgBytes in $images) {
    $writer.Write($imgBytes)
}
$writer.Flush()

[System.IO.File]::WriteAllBytes($outPath, $ms.ToArray())
$writer.Dispose()
$ms.Dispose()
$bmp.Dispose()

Write-Host "Icon created: $outPath"
