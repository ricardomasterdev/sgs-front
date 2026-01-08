@echo off
chcp 65001 >nul
title SGSx WhatsApp Service

:menu
cls
echo ============================================
echo   SGSx WhatsApp Service - Gerenciador
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
echo   SGSx WhatsApp - MODO DESENVOLVIMENTO
echo ============================================
echo.
echo Diretorio: C:\SGSx-Whatsapp
echo Porta: 3003
echo Certificados: mkcert (localhost)
echo Dominio: https://localhost:3003
echo.
cd /d C:\SGSx-Whatsapp
echo Verificando porta 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
    echo Encerrando processo na porta 3003 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo Compilando TypeScript...
call npm run build
echo.
echo Iniciando servidor (desenvolvimento)...
echo ============================================
echo.
call npm run start
pause
goto menu

:run_prod
cls
echo ============================================
echo   SGSx WhatsApp - MODO PRODUCAO
echo ============================================
echo.
echo Diretorio: C:\SGSx-Whatsapp
echo Porta: 3003
echo Certificados: Let's Encrypt
echo Dominio: https://ws-sgs.cdxsistemas.com.br:3003
echo.
cd /d C:\SGSx-Whatsapp
echo Verificando porta 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
    echo Encerrando processo na porta 3003 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
echo.
echo Compilando TypeScript...
call npm run build
echo.
echo Iniciando servidor em producao...
echo ============================================
echo.
set NODE_ENV=production
call npm run start:prod
pause
goto menu

:sair
exit
