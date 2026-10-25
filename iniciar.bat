@echo off
title ZapDirect Saloes - WhatsApp Web
echo ====================================================
echo    Iniciando ZapDirect Saloes...
echo    Acesse no seu navegador: http://localhost:3000
echo ====================================================
start http://localhost:3000
python -m http.server 3000
pause
