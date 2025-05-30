// Configuração para ambiente de produção
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://sistema-atendimento-backend.onrender.com/api';

// Variáveis globais
let clientes = [];

// Elementos DOM
const tabelaRelatorioEl = document.getElementById('tabelaRelatorio');
const corpoTabelaEl = document.getElementById('corpoTabela');
const semRegistrosEl = document.getElementById('semRegistros');
const txtBuscaEl = document.getElementById('txtBusca');
const btnBuscarEl = document.getElementById('btnBuscar');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarClientes();
    configurarEventListeners();
});

// Carregar clientes da API
async function carregarClientes() {
    try {
        const response = await fetch(`${API_URL}/clientes`);
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }
        
        clientes = await response.json();
        exibirRelatorio(clientes);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar clientes. Verifique o console para mais detalhes.');
    }
}

// Configurar event listeners
function configurarEventListeners() {
    btnBuscarEl.addEventListener('click', filtrarClientes);
    txtBuscaEl.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filtrarClientes();
        }
    });
}

// Filtrar clientes
function filtrarClientes() {
    const termoBusca = txtBuscaEl.value.toLowerCase().trim();
    
    if (!termoBusca) {
        exibirRelatorio(clientes);
        return;
    }
    
    const clientesFiltrados = clientes.filter(cliente => {
        return (
            (cliente.nome && cliente.nome.toLowerCase().includes(termoBusca)) ||
            (cliente.numero && cliente.numero.toLowerCase().includes(termoBusca)) ||
            (cliente.cnpj && cliente.cnpj.toLowerCase().includes(termoBusca))
        );
    });
    
    exibirRelatorio(clientesFiltrados);
}

// Exibir relatório
function exibirRelatorio(clientesExibir) {
    // Limpar tabela
    corpoTabelaEl.innerHTML = '';
    
    if (clientesExibir.length === 0) {
        tabelaRelatorioEl.classList.add('hidden');
        semRegistrosEl.classList.remove('hidden');
        return;
    }
    
    tabelaRelatorioEl.classList.remove('hidden');
    semRegistrosEl.classList.add('hidden');
    
    // Preencher tabela com dados
    clientesExibir.forEach(cliente => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${cliente.numero || '-'}</td>
            <td>${cliente.nome || '-'}</td>
            <td>${cliente.cnpj || '-'}</td>
            <td>${cliente.cidade || '-'}</td>
            <td>${cliente.atendeu ? 'Sim' : 'Não'}</td>
            <td>${cliente.atencao ? 'Sim' : 'Não'}</td>
            <td>${cliente.fechamento ? 'Sim' : 'Não'}</td>
            <td>${cliente.observacoes || '-'}</td>
        `;
        
        corpoTabelaEl.appendChild(tr);
    });
}
