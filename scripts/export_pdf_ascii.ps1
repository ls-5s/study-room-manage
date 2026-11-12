# Export PDF via WPS with retry (ASCII only to avoid PS 5.1 encoding issues)
param(
    [string]$Docx = "C:\Users\11385\Desktop\bj\thesis\final\wen.docx",
    [string]$Pdf = "C:\Users\11385\Desktop\bj\thesis\final\wen.pdf"
)

for ($attempt = 1; $attempt -le 3; $attempt++) {
    Get-Process wps, wpspdf -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    try {
        $wps = New-Object -ComObject KWPS.Application
        $wps.Visible = $true
        $wps.DisplayAlerts = 0
        Start-Sleep -Seconds 1
        $doc = $wps.Documents.Open($Docx)
        Start-Sleep -Seconds 2
        if ($null -eq $doc) {
            Write-Output ("attempt " + $attempt + ": open null")
            continue
        }
        try { $doc.Fields.Update() | Out-Null } catch { }
        Start-Sleep -Milliseconds 500
        try {
            if ($doc.TablesOfContents.Count -gt 0) {
                $doc.TablesOfContents.Item(1).Update() | Out-Null
            }
        } catch { }
        if (Test-Path $Pdf) { Remove-Item $Pdf -Force -ErrorAction SilentlyContinue }
        $doc.ExportAsFixedFormat($Pdf, 17)
        Start-Sleep -Seconds 3
        if (Test-Path $Pdf) {
            Write-Output ("attempt " + $attempt + ": ok " + (Get-Item $Pdf).Length)
            try { $doc.Close(0) } catch { }
            try { $wps.Quit() } catch { }
            return
        }
        Write-Output ("attempt " + $attempt + ": pdf missing")
    }
    catch {
        Write-Output ("attempt " + $attempt + ": " + $_.Exception.Message)
    }
}
