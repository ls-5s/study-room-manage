# Export PDF via WPS using a unique temp copy of the DOCX (avoids stale reuse).
param(
    [string]$Docx = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿.docx",
    [string]$Pdf  = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿.pdf"
)

Get-Process wps, wpspdf -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$stamp = Get-Date -Format "HHmmss"
$tmpDocx = Join-Path $env:TEMP ("thesis_" + $stamp + ".docx")
$tmpPdf  = Join-Path $env:TEMP ("thesis_" + $stamp + ".pdf")
Copy-Item -Force $Docx $tmpDocx

$wps = New-Object -ComObject KWPS.Application
$wps.Visible = $true
$wps.DisplayAlerts = 0
$doc = $wps.Documents.Open($tmpDocx)
Start-Sleep -Seconds 2

try { $doc.Fields.Update() | Out-Null } catch { }
Start-Sleep -Milliseconds 500
try {
    if ($doc.TablesOfContents.Count -gt 0) {
        $doc.TablesOfContents.Item(1).Update() | Out-Null
    }
} catch { }
Start-Sleep -Seconds 1

$doc.Save()
$doc.ExportAsFixedFormat($tmpPdf, 17)
Start-Sleep -Seconds 3

if (Test-Path $tmpPdf) {
    Copy-Item -Force $tmpPdf $Pdf
    Write-Output ("exported " + (Get-Item $Pdf).Length)
} else {
    Write-Output "export failed"
}

try { $doc.Close(0) } catch { }
try { $wps.Quit() } catch { }
Remove-Item $tmpDocx -Force -ErrorAction SilentlyContinue
Remove-Item $tmpPdf -Force -ErrorAction SilentlyContinue
