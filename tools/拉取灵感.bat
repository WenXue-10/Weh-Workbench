@echo off
chcp 65001 >nul
setlocal
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "C:\Program Files\nodejs\node.exe" set "NODE=C:\Program Files\nodejs\node.exe"
if not defined NODE if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2-3\node.exe" set "NODE=%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2-3\node.exe"
if not defined NODE (
  echo [x] 没有找到 node，请先安装 Node.js
  pause
  exit /b 1
)

if not exist "%USERPROFILE%\.weh-atelier\inspire-inbox.json" (
  echo 首次使用：先填 GitHub Token 和 Gist ID
  "%NODE%" "%~dp0inspire-inbox.mjs" --setup
  echo.
)

"%NODE%" "%~dp0inspire-inbox.mjs" %*
echo.
pause
