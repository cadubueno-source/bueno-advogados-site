@echo off
chcp 65001 >nul
title Publicar site - Bueno Advogados
cd /d "%~dp0.."
where git >/dev/null 2>/dev/null || (echo Git nao encontrado neste computador. & pause & exit /b 1)
echo Publicando a pagina Parceiros no site...
git add parceiros.html index.html escritorio.html atuacao.html calculadora-difal.html equipe.html publicacoes.html carreiras.html ouvidoria.html contato.html artigo-split-payment-reforma-tributaria.html informativo-restituicao-icms-contabilidades.html informativo-restituicao-icms-empresas.html
git commit -m "Nova pagina Parceiros e link no menu e rodape"
git push origin main
if errorlevel 1 (echo. & echo ERRO ao enviar. Tire um print desta tela e mande para o Claude.) else (echo. & echo PRONTO. O Netlify publica em 1 a 2 minutos: https://www.buenoadvogados.com.br/parceiros.html)
pause
