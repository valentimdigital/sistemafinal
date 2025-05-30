# Guia de Instalação e Uso - Sistema de Atendimento Valentim Digital

Este documento contém instruções detalhadas para instalar e executar o Sistema de Atendimento Valentim Digital em seu computador local.

## Pré-requisitos

- **Node.js**: O sistema requer Node.js versão 14 ou superior
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Escolha a versão LTS (Long Term Support) para maior estabilidade

## Instalação

1. Extraia o arquivo ZIP em uma pasta de sua preferência
2. Você verá a seguinte estrutura de arquivos:
   - `frontend/` - Pasta contendo a interface do sistema
   - `iniciar_sistema.bat` - Script para iniciar o sistema no Windows
   - `iniciar_sistema.sh` - Script para iniciar o sistema no Linux/Mac
   - `README.md` - Este arquivo de instruções

## Execução no Windows

### Usando o PowerShell ou Prompt de Comando

1. Abra o Windows PowerShell ou Prompt de Comando
2. Navegue até a pasta onde você extraiu os arquivos:
   ```
   cd caminho\para\sistema_atendimento
   ```
3. Execute o script de inicialização:
   ```
   .\iniciar_sistema.bat
   ```
4. O sistema verificará automaticamente se o Node.js está instalado
5. Se necessário, instalará o servidor HTTP (http-server)
6. O servidor será iniciado na porta 8080
7. Uma janela do navegador será aberta automaticamente com o sistema
8. Caso não abra, acesse manualmente: [http://localhost:8080](http://localhost:8080)

### Método Alternativo (Clique Duplo)

1. Navegue até a pasta onde você extraiu os arquivos usando o Explorador de Arquivos
2. Dê um duplo clique no arquivo `iniciar_sistema.bat`
3. Siga as instruções na tela

## Uso do Sistema

### Página de Atendimento

- **Filtrar Clientes**: Use o seletor "Filtrar" para mostrar todos os clientes, apenas os atendidos ou não atendidos
- **Navegação**: Use os botões "Anterior" e "Próximo" para navegar entre os clientes
- **Status de Atendimento**: Clique nos botões "Sim" ou "Não" para marcar o status do cliente
- **Observações**: Digite suas anotações sobre o atendimento na área de texto
- **Salvar**: Clique em "Salvar Atendimento" para registrar as informações

### Adicionar Cliente

- Acesse a página "Adicionar Cliente" pelo menu superior
- Preencha os campos obrigatórios (pelo menos o telefone)
- Clique em "Adicionar Cliente" para registrar o novo contato
- O cliente será adicionado à lista de atendimento

### Relatório

- Acesse a página "Relatório" pelo menu superior
- Visualize todos os atendimentos realizados
- Use a caixa de busca para filtrar por nome, telefone ou CNPJ

## Encerramento

- Para encerrar o sistema, pressione qualquer tecla na janela do PowerShell/Prompt
- O servidor será encerrado automaticamente

## Solução de Problemas

- **Erro "Node.js não encontrado"**: Instale o Node.js a partir do site oficial
- **Erro ao iniciar o servidor**: Verifique se a porta 8080 não está sendo usada por outro programa
- **Dados não aparecem**: Os dados são armazenados localmente no navegador. Tente limpar o cache se houver problemas

## Contato e Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe Valentim Digital.
