// Script para adicionar novos clientes
document.addEventListener('DOMContentLoaded', () => {
    const formAdicionarCliente = document.getElementById('formAdicionarCliente');
    
    formAdicionarCliente.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Obter valores do formulário
        const telefone = document.getElementById('telefone').value;
        const nome = document.getElementById('nome').value;
        const cnpj = document.getElementById('cnpj').value;
        const cidade = document.getElementById('cidade').value;
        const observacoes = document.getElementById('observacoes').value;
        
        // Validar telefone (campo obrigatório)
        if (!telefone) {
            alert('Por favor, informe o telefone do cliente.');
            return;
        }
        
        // Criar objeto do novo cliente
        const novoCliente = {
            id: Date.now(), // ID único baseado no timestamp
            numero: telefone,
            nome: nome || '',
            cnpj: cnpj || '',
            cidade: cidade || '',
            atendeu: false,
            atencao: false,
            fechamento: false,
            observacoes: observacoes || ''
        };
        
        // Obter lista atual de clientes do localStorage
        let clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
        
        // Adicionar novo cliente à lista
        clientes.push(novoCliente);
        
        // Salvar lista atualizada no localStorage
        localStorage.setItem('clientes', JSON.stringify(clientes));
        
        // Exibir mensagem de sucesso
        alert('Cliente adicionado com sucesso!');
        
        // Limpar formulário
        formAdicionarCliente.reset();
        
        // Opção para redirecionar para a página de atendimento
        if (confirm('Cliente adicionado com sucesso! Deseja ir para a página de atendimento?')) {
            window.location.href = 'index.html';
        }
    });
});
