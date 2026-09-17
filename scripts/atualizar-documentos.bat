@echo off
cd /d "%~dp0.."
echo Atualizando a lista de documentos da area interna...
echo.
node "scripts\atualizar-documentos.js"
echo.
pause
