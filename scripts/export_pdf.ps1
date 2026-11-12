# 用 WPS COM 更新目录域并导出 PDF
$ErrorActionPreference = "Stop"
$docx = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿.docx"
$pdf  = "C:\Users\11385\Desktop\bj\thesis\final\论文终稿.pdf"

$wps = New-Object -ComObject KWPS.Application
$wps.Visible = $false
$wps.DisplayAlerts = 0
try {
    $doc = $wps.Documents.Open($docx)

    # 更新所有域（含目录）
    try { $doc.Fields.Update() | Out-Null } catch { }
    for ($i = 1; $i -le $doc.TablesOfContents.Count; $i++) {
        try { $doc.TablesOfContents.Item($i).Update() | Out-Null } catch { }
    }
    $doc.Repaginate()

    $doc.Save()
    $doc.SaveAs([ref]$pdf, [ref]17)
    "PDF 导出完成：$pdf"
} finally {
    try { $doc.Close(0) } catch { }
    $wps.Quit()
}
