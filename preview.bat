@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动本地交互原型服务 (http://127.0.0.1:8765) ...
start "" http://127.0.0.1:8765/index.html
python serve.py
