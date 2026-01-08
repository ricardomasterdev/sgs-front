@echo off
chcp 65001 >nul
title GPVx API - Gerenciador de Servico

:menu
cls
echo ========================================
echo   GPVx API - Gerenciador de Servico
echo ========================================
echo.
echo   [1] Rodar DESENVOLVIMENTO (localhost)
echo   [2] Rodar PRODUCAO (dominio cdxsistemas)
echo   [3] Ver status do servico Windows
echo   [4] Iniciar servico Windows
echo   [5] Parar servico Windows
echo   [6] Reiniciar servico Windows
echo   [7] Ver logs (tempo real)
echo   [8] Abrir API no navegador
echo   [9] Abrir Swagger (docs)
echo.
echo   [I] Instalar servico Windows
echo   [D] Desinstalar servico Windows
echo.
echo   [0] Sair
echo.
echo ========================================
set /p opcao="Escolha uma opcao: "

if "%opcao%"=="1" goto run_dev
if "%opcao%"=="2" goto run_prod
if "%opcao%"=="3" goto status
if "%opcao%"=="4" goto start
if "%opcao%"=="5" goto stop
if "%opcao%"=="6" goto restart
if "%opcao%"=="7" goto logs
if "%opcao%"=="8" goto open_api
if "%opcao%"=="9" goto open_docs
if /i "%opcao%"=="I" goto install
if /i "%opcao%"=="D" goto uninstall
if "%opcao%"=="0" goto sair

echo Opcao invalida!
pause
goto menu

:run_dev
cls
echo.
echo ============================================
echo   GPVx API - MODO DESENVOLVIMENTO
echo ============================================
echo.
echo Diretorio: C:\gpvx-back
echo Porta: 8000
echo Certificados: mkcert (localhost)
echo Dominio: https://localhost:8000
echo.
echo Iniciando servidor...
echo ============================================
echo.
cd /d C:\gpvx-back
call .\venv\Scripts\activate.bat
echo.
echo [VENV ATIVADO] Executando: py main.py (desenvolvimento)
echo.
echo ============================================
echo   SERVIDOR RODANDO - Pressione Ctrl+C para parar
echo ============================================
echo.
py main.py
echo.
echo ============================================
echo   SERVIDOR ENCERRADO
echo ============================================
pause
goto menu

:run_prod
cls
echo.
echo ============================================
echo   GPVx API - MODO PRODUCAO
echo ============================================
echo.
echo Diretorio: C:\gpvx-back
echo Porta: 8000
echo Certificados: Let's Encrypt
echo Dominio: https://api-gpvx.cdxsistemas.com.br:8000
echo.
echo Iniciando servidor em producao...
echo ============================================
echo.
cd /d C:\gpvx-back
call .\venv\Scripts\activate.bat
echo.
echo [VENV ATIVADO] Executando: py main.py --production
echo.
echo ============================================
echo   SERVIDOR RODANDO - Pressione Ctrl+C para parar
echo ============================================
echo.
py main.py --production
echo.
echo ============================================
echo   SERVIDOR ENCERRADO
echo ============================================
pause
goto menu

:status
cls
echo.
echo Verificando status...
echo.
C:\nssm\nssm-2.24\win64\nssm.exe status GPVxAPI
echo.
pause
goto menu

:start
cls
echo.
echo Iniciando servico...
echo.
C:\nssm\nssm-2.24\win64\nssm.exe start GPVxAPI
timeout /t 2 >nul
C:\nssm\nssm-2.24\win64\nssm.exe status GPVxAPI
echo.
pause
goto menu

:stop
cls
echo.
echo Parando servico...
echo.
C:\nssm\nssm-2.24\win64\nssm.exe stop GPVxAPI
timeout /t 2 >nul
C:\nssm\nssm-2.24\win64\nssm.exe status GPVxAPI
echo.
pause
goto menu

:restart
cls
echo.
echo Reiniciando servico...
echo.
C:\nssm\nssm-2.24\win64\nssm.exe restart GPVxAPI
timeout /t 2 >nul
C:\nssm\nssm-2.24\win64\nssm.exe status GPVxAPI
echo.
pause
goto menu

:logs
cls
echo.
echo Mostrando logs (Ctrl+C para voltar ao menu)...
echo.
if exist "C:\gpvx-back\logs\stdout.log" (
    powershell -Command "Get-Content 'C:\gpvx-back\logs\stdout.log' -Tail 50 -Wait"
) else (
    echo Arquivo de log nao encontrado.
    echo O servico ja foi iniciado pelo menos uma vez?
    pause
)
goto menu

:open_api
start https://localhost:8000
goto menu

:open_docs
start https://localhost:8000/docs
goto menu

:install
cls
echo.
echo Executando instalacao do servico...
echo (Requer permissao de Administrador)
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0install-service.ps1"
echo.
pause
goto menu

:uninstall
cls
echo.
echo Removendo servico...
echo (Requer permissao de Administrador)
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0uninstall-service.ps1"
echo.
pause
goto menu

:sair
exit
