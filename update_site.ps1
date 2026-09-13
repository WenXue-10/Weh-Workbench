# Weh Atelier 本地构建验证脚本（v5）
# 用途：本地一键运行 build_site.py 重新生成 docs/，用于预览/验证。
# 重要：本脚本【不提交、不推送】。发布由 GitHub Actions 自动完成——
#       你只需 push 代码/知识库，Actions 会自动构建并把 docs/ 部署到 GitHub Pages。
# 请勿在本脚本中加入 git add/commit/push，避免与 Actions 重复提交 docs/。

$ErrorActionPreference = "Continue"
$vault = "D:\Obsidian\Weh-Workbench"
$py    = "C:\Users\22814\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
Set-Location $vault

# 并发保护（pid 文件）
$pidFile = Join-Path $vault ".sync_pid"
if (Test-Path $pidFile) {
    $oldPid = (Get-Content $pidFile -Raw).Trim()
    $oldProc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
    if ($oldProc) {
        Write-Host "上一轮构建仍在运行（PID $oldPid），跳过"
        exit 0
    }
    Remove-Item $pidFile -Force
}
$PID | Out-File $pidFile -Encoding ASCII

try {
    Write-Host "=== 本地构建开始 ==="
    & $py "$vault\build_site.py"
    if ($LASTEXITCODE -eq 0 -and (Test-Path "$vault\docs\index.html")) {
        Write-Host "✅ 构建成功。本地预览：用浏览器打开 $vault\docs\index.html"
        Write-Host "🚀 发布：push 代码/知识库到 GitHub 后，Actions 会自动部署，无需手动推送 docs/"
    } else {
        Write-Host "❌ 构建失败，请查看 build_site.py 的报错输出"
    }
} finally {
    if (Test-Path $pidFile) { Remove-Item $pidFile -Force }
}
