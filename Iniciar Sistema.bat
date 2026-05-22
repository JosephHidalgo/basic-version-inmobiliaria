@echo off
title Sistema Inmobiliario
cd /d "%~dp0"

echo ============================================
echo   SISTEMA INMOBILIARIO
echo   Iniciando servidor...
echo ============================================
echo.

start "" http://localhost:3000

node backend/server.js

echo.
echo Servidor detenido. Presiona cualquier tecla para cerrar...
pause >nul
