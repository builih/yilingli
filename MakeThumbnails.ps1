$src = "images"
$dst = "tn"

if (!(Test-Path $dst)) { New-Item -ItemType Directory -Path $dst }

Get-ChildItem "$src\*.jpg","$src\*.png" | ForEach-Object {
    $base = $_.Name
    $out = Join-Path $dst $base
    if (!(Test-Path $out)) {
        & "C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe" $_.FullName -thumbnail 160x160 $out
    }
}
