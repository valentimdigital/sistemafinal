#!/bin/bash
echo "Iniciando Sistema de Atendimento Valentim Digital..."
echo

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "ERRO: Node.js não encontrado. Por favor, instale o Node.js antes de continuar."
    echo "Você pode baixar o Node.js em: https://nodejs.org/"
    exit 1
fi

# Verificar se o http-server está instalado
if ! npm list -g http-server &> /dev/null; then
    echo "Instalando servidor HTTP..."
    npm install -g http-server
    if [ $? -ne 0 ]; then
        echo "ERRO: Falha ao instalar http-server."
        exit 1
    fi
fi

echo "Servidor HTTP instalado com sucesso!"
echo

# Iniciar o servidor HTTP na pasta frontend
echo "Iniciando o servidor web..."
http-server frontend -p 8080 --cors &
SERVER_PID=$!

echo
echo "Sistema iniciado com sucesso!"
echo
echo "Acesse o sistema em: http://localhost:8080"
echo
echo "Pressione Ctrl+C para encerrar o servidor quando terminar..."

# Aguardar sinal de interrupção
trap "kill $SERVER_PID; echo; echo 'Servidor encerrado.'; exit 0" INT
wait $SERVER_PID
