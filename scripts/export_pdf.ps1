# 带重试的 PDF 导出：WPS 偶发返回空文档对象
param(
    [string]$Docx = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿.docx",
    [string]$Pdf = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿-排版版.pdf"
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
            Write-Output ("attempt " + $attempt + ": open returned null")
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
            Write-Output ("attempt " + $attempt + ": exported " + (Get-Item $Pdf).Length + " bytes")
            try { $doc.Close(0) } catch { }
            try { $wps.Quit() } catch { }
            return
        }
        Write-Output ("attempt " + $attempt + ": pdf missing")
    }
    catch {
        Write-Output ("attempt " + $attempt + " failed: " + $_.Exception.Message)
    }
}
