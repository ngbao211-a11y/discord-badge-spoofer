@echo off
chcp 65001 >nul
title Discord Badge Spoofer - Skidder by Yusei
cls
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║  DISCORD BADGE SPOOFER — Skidder by Yusei   ║
echo  ╚══════════════════════════════════════════════╝
echo.
echo  [+] Đang khởi động máy chủ Web...
echo  [+] Tự động mở trình duyệt: http://127.0.0.1:7860
echo.
echo  Mẹo: Nhấn Ctrl+C trong cửa sổ này để tắt server.
echo  ════════════════════════════════════════════════
echo.

cd /d "%~dp0"
start "" "http://127.0.0.1:7860"
python server.py

echo.
echo  Server đã dừng. Nhấn phím bất kỳ để đóng...
pause >nul
