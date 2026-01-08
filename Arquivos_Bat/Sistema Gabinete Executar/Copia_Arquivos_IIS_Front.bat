@echo off
title Copia Arquivos - GPVx Deploy

:MENU
cls
echo ============================================================
echo                     DEPLOY SGS - IIS
echo ============================================================
echo.
echo    [1] Copia arquivos
echo    [0] Sair
echo.
echo ============================================================
echo.
set /p opcao=Escolha uma opcao:

if "%opcao%"=="1" goto COPIAR
if "%opcao%"=="0" goto SAIR
echo Opcao invalida! Tente novamente.
timeout /t 2 >nul
goto MENU

:COPIAR
cls
echo ============================================================
echo   COPIANDO ARQUIVOS DE C:\gpvx-front\dist PARA C:\Web\sgs
echo ============================================================
echo.

if not exist "C:\gpvx-front\dist" (
    echo [ERRO] Pasta de origem C:\gpvx-front\dist nao encontrada!
    echo.
    pause
    goto MENU
)

if not exist "C:\Web\sgs" (
    echo Criando pasta de destino C:\Web\sgs...
    mkdir "C:\Web\gpvx"
)

echo Iniciando copia dos arquivos...
echo.

xcopy "C:\gpvx-front\dist\*" "C:\Web\gpvx\" /E /Y /I /F

echo.
echo ============================================================
echo              CONCLUIDO COM SUCESSO!
echo ============================================================
echo.
pause
goto MENU

:SAIR
echo.
echo Saindo...
exit
