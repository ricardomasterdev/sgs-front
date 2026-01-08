@echo off
chcp 65001 >nul
title GPVx WhatsApp Service

:menu
cls
echo ============================================
echo   GPVx WhatsApp Service - Gerenciador
echo ============================================
echo.
echo   [1] Rodar DESENVOLVIMENTO (localhost)
echo   [2] Rodar PRODUCAO (dominio cdxsistemas)
echo   [0] Sair
echo.
echo ============================================
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto run_dev
if "%opcao%"=="2" goto run_prod
if "%opcao%"=="0" goto sair

echo Opcao invalida!
pause
goto menu

:run_dev
cls
echo ============================================
echo   GPVx WhatsApp - MODO DESENVOLVIMENTO
echo ============================================
echo.
echo Diretorio: C:\GPVx-Whatsapp
echo Porta: 3002
echo Certificados: mkcert (localhost)
echo Dominio: https://localhost:3002
echo.
cd /d C:\GPVx-Whatsapp
echo Verificando porta 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    echo Encerrando processo na porta 3002 - PID: %%a
    taskkill /F /PID %%a 2>nul
)
echo Aguardando liberacao da porta...
timeout /t 2 /nobreak >nul
echo.
echo Iniciando servidor (desenvolvimento)...
echo ============================================
echo.
node src/index.js
pause
goto menu

:run_prod
cls
echo ============================================
echo   GPVx WhatsApp - MODO PRODUCAO
echo ============================================
echo.
echo Diretorio: C:\GPVx-Whatsapp
echo Porta Interna: 3001 (HTTP - comunicacao Python)
echo Porta Externa: 3004 (HTTPS - frontend)
echo Certificados: Let's Encrypt
echo Dominio: https://ws-gpvx.cdxsistemas.com.br:3004
echo.
cd /d C:\GPVx-Whatsapp

echo Encerrando processos Node.js existentes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Verificando portas 3001 e 3004...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo Encerrando processo na porta 3001 - PID: %%a
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3004" ^| findstr "LISTENING"') do (
    echo Encerrando processo na porta 3004 - PID: %%a
    taskkill /F /PID %%a 2>nul
)
echo Aguardando liberacao das portas...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando servidor em producao...
echo ============================================
echo.
set NODE_ENV=production
node src/index.js
pause
goto menu

:sair
exit
