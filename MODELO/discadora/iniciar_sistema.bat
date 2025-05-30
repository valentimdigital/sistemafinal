@echo off
echo Iniciando Sistema de Atendimento Valentim Digital...
echo.

REM Verificar se o Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js não encontrado. Por favor, instale o Node.js antes de continuar.
    echo Você pode baixar o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se o http-server está instalado
call npm list -g http-server >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Instalando servidor HTTP...
    call npm install -g http-server
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar http-server.
        pause
        exit /b 1
    )
)

echo Servidor HTTP instalado com sucesso!
echo.

REM Iniciar o servidor HTTP na pasta frontend
echo Iniciando o servidor web...
start "" http-server frontend -p 8080 --cors

echo.
echo Sistema iniciado com sucesso!
echo.
echo Acesse o sistema em: http://localhost:8080
echo.
echo Pressione qualquer tecla para encerrar o servidor quando terminar...
pause >nul

REM Encerrar o servidor HTTP
taskkill /f /im node.exe >nul 2>nul
echo Servidor encerrado.
pause
