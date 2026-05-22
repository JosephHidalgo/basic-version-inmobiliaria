@echo off
title Configurar Sistema Inmobiliario
cd /d "%~dp0"

echo ============================================
echo   CONFIGURACION DEL SISTEMA INMOBILIARIO
echo ============================================
echo.
echo Instalando dependencias...
echo.

call npm install --omit=dev

echo.
echo ============================================
echo   INSTALACION COMPLETA
echo ============================================
echo.
echo Para iniciar el sistema, haz doble clic en:
echo   "Iniciar Sistema.bat"
echo.
echo Usuario: admin
echo Clave:   admin123
echo.
pause
