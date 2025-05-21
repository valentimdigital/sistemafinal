// Configuração para ambiente de produção
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://sistema-atendimento-backend.onrender.com/api';

// Dados mockados para teste (serão usados apenas se não houver dados no localStorage)
const dadosMockados = [
  {
    id: 1,
    numero: "5511987654321",
    nome: "Tech Solutions Ltda",
    cnpj: "12.345.678/0001-90",
    cidade: "São Paulo",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "Empresa de tecnologia interessada em serviços digitais."
  },
  {
    id: 2,
    numero: "5521976543210",
    nome: "Comércio Digital SA",
    cnpj: "23.456.789/0001-01",
    cidade: "Rio de Janeiro",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "E-commerce em expansão buscando novas soluções."
  },
  {
    id: 3,
    numero: "5531965432109",
    nome: "Indústria Inovadora ME",
    cnpj: "34.567.890/0001-12",
    cidade: "Belo Horizonte",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "Pequena indústria com foco em inovação."
  },
  {
    id: 4,
    numero: "5561954321098",
    nome: "Serviços Especializados EIRELI",
    cnpj: "45.678.901/0001-23",
    cidade: "Brasília",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "Empresa de consultoria especializada."
  },
  {
    id: 5,
    numero: "5571943210987",
    nome: "Distribuidora Nacional Ltda",
    cnpj: "56.789.012/0001-34",
    cidade: "Salvador",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "Distribuidora com atuação nacional."
  },
  {
    id: 6,
    numero: "5585932109876",
    nome: "Empresa sem CNPJ",
    cnpj: "FALTA CNPJ",
    cidade: "Fortaleza",
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: "Este contato está marcado com FALTA CNPJ."
  }
];

// Variáveis globais
let clientes = [];
let clientesFiltrados = [];
let clienteAtualIndex = 0;
let clienteAtual = null;
let filtroAtual = 'nao-atendidos'; // Filtro padrão: não atendidos

// Elementos DOM
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar elementos DOM
  const statusAtendimentoEl = document.getElementById('statusAtendimento');
  const telefoneClienteEl = document.getElementById('telefoneCliente');
  const nomeClienteEl = document.getElementById('nomeCliente');
  const cnpjClienteEl = document.getElementById('cnpjCliente');
  const cidadeClienteEl = document.getElementById('cidadeCliente');
  const clienteAtualEl = document.getElementById('clienteAtual');
  const totalClientesEl = document.getElementById('totalClientes');
  const txtObservacoesEl = document.getElementById('txtObservacoes');
  const filtroStatusEl = document.getElementById('filtroStatus');

  // Botões de navegação
  const btnAnteriorEl = document.getElementById('btnAnterior');
  const btnProximoEl = document.getElementById('btnProximo');

  // Botões de status
  const btnAtendeuSimEl = document.getElementById('btnAtendeuSim');
  const btnAtendeuNaoEl = document.getElementById('btnAtendeuNao');
  const btnAtencaoSimEl = document.getElementById('btnAtencaoSim');
  const btnAtencaoNaoEl = document.getElementById('btnAtencaoNao');
  const btnFechamentoSimEl = document.getElementById('btnFechamentoSim');
  const btnFechamentoNaoEl = document.getElementById('btnFechamentoNao');

  // Botão de salvar
  const btnSalvarEl = document.getElementById('btnSalvar');

  // Configurar event listeners
  configurarEventListeners();

  // Carregar clientes do localStorage ou usar dados mockados
  carregarClientes();

  // Função para configurar event listeners
  function configurarEventListeners() {
    // Filtro de status
    filtroStatusEl.addEventListener('change', () => {
      filtroAtual = filtroStatusEl.value;
      aplicarFiltro();
    });
    
    // Navegação
    btnAnteriorEl.addEventListener('click', navegarParaAnterior);
    btnProximoEl.addEventListener('click', navegarParaProximo);
    
    // Status de atendimento
    btnAtendeuSimEl.addEventListener('click', () => {
      toggleStatus('atendeu', true);
      atualizarAvisoStatusAtendimento(true);
    });
    
    btnAtendeuNaoEl.addEventListener('click', () => {
      toggleStatus('atendeu', false);
      atualizarAvisoStatusAtendimento(false);
    });
    
    btnAtencaoSimEl.addEventListener('click', () => toggleStatus('atencao', true));
    btnAtencaoNaoEl.addEventListener('click', () => toggleStatus('atencao', false));
    btnFechamentoSimEl.addEventListener('click', () => toggleStatus('fechamento', true));
    btnFechamentoNaoEl.addEventListener('click', () => toggleStatus('fechamento', false));
    
    // Salvar atendimento
    btnSalvarEl.addEventListener('click', salvarAtendimento);
  }

  // Carregar clientes do localStorage ou usar dados mockados
  function carregarClientes() {
    // Tentar carregar do localStorage primeiro
    const clientesLocalStorage = localStorage.getItem('clientes');
    
    if (clientesLocalStorage) {
      clientes = JSON.parse(clientesLocalStorage);
    } else {
      // Se não houver dados no localStorage, usar dados mockados
      clientes = [...dadosMockados];
      // Salvar dados mockados no localStorage para uso futuro
      localStorage.setItem('clientes', JSON.stringify(clientes));
    }
    
    // Aplicar filtro inicial
    aplicarFiltro();
  }

  // Aplicar filtro aos clientes
  function aplicarFiltro() {
    switch (filtroAtual) {
      case 'atendidos':
        clientesFiltrados = clientes.filter(cliente => cliente.atendeu);
        break;
      case 'nao-atendidos':
        clientesFiltrados = clientes.filter(cliente => !cliente.atendeu);
        break;
      case 'todos':
      default:
        clientesFiltrados = [...clientes];
        break;
    }
    
    // Resetar índice atual e atualizar interface
    clienteAtualIndex = 0;
    atualizarTotalClientes();
    exibirClienteAtual();
  }

  // Exibir cliente atual
  function exibirClienteAtual() {
    if (clientesFiltrados.length === 0) {
      limparDadosCliente();
      return;
    }
    
    const cliente = clientesFiltrados[clienteAtualIndex];
    clienteAtual = cliente;
    
    // Atualizar dados do cliente
    telefoneClienteEl.textContent = cliente.numero || '-';
    nomeClienteEl.textContent = cliente.nome || '-';
    cnpjClienteEl.textContent = cliente.cnpj || '-';
    cidadeClienteEl.textContent = cliente.cidade || '-';
    txtObservacoesEl.value = cliente.observacoes || '';
    
    // Atualizar status
    atualizarBotoesStatus('atendeu', cliente.atendeu);
    atualizarBotoesStatus('atencao', cliente.atencao);
    atualizarBotoesStatus('fechamento', cliente.fechamento);
    
    // Atualizar aviso de status de atendimento
    atualizarAvisoStatusAtendimento(cliente.atendeu);
    
    // Atualizar contador
    clienteAtualEl.textContent = clienteAtualIndex + 1;
    
    // Atualizar estado dos botões de navegação
    btnAnteriorEl.disabled = clienteAtualIndex === 0;
    btnProximoEl.disabled = clienteAtualIndex === clientesFiltrados.length - 1;
  }

  // Limpar dados do cliente
  function limparDadosCliente() {
    telefoneClienteEl.textContent = '-';
    nomeClienteEl.textContent = '-';
    cnpjClienteEl.textContent = '-';
    cidadeClienteEl.textContent = '-';
    txtObservacoesEl.value = '';
    
    atualizarBotoesStatus('atendeu', false);
    atualizarBotoesStatus('atencao', false);
    atualizarBotoesStatus('fechamento', false);
    atualizarAvisoStatusAtendimento(false);
    
    clienteAtualEl.textContent = '0';
    totalClientesEl.textContent = '0';
    
    btnAnteriorEl.disabled = true;
    btnProximoEl.disabled = true;
  }

  // Atualizar aviso de status de atendimento
  function atualizarAvisoStatusAtendimento(atendeu) {
    if (atendeu) {
      statusAtendimentoEl.textContent = 'CLIENTE ATENDIDO';
      statusAtendimentoEl.classList.remove('nao-atendido');
      statusAtendimentoEl.classList.add('atendido');
    } else {
      statusAtendimentoEl.textContent = 'CLIENTE NÃO ATENDIDO';
      statusAtendimentoEl.classList.remove('atendido');
      statusAtendimentoEl.classList.add('nao-atendido');
    }
  }

  // Atualizar total de clientes
  function atualizarTotalClientes() {
    totalClientesEl.textContent = clientesFiltrados.length;
  }

  // Navegar para o cliente anterior
  function navegarParaAnterior() {
    if (clienteAtualIndex > 0) {
      clienteAtualIndex--;
      exibirClienteAtual();
    }
  }

  // Navegar para o próximo cliente
  function navegarParaProximo() {
    if (clienteAtualIndex < clientesFiltrados.length - 1) {
      clienteAtualIndex++;
      exibirClienteAtual();
    }
  }

  // Alternar status (sim/não)
  function toggleStatus(tipo, valor) {
    // Atualizar estado visual dos botões
    atualizarBotoesStatus(tipo, valor);
    
    // Atualizar dados do cliente em memória
    if (clientesFiltrados.length > 0) {
      const cliente = clientesFiltrados[clienteAtualIndex];
      cliente[tipo] = valor;
      
      // Encontrar o cliente na lista original e atualizá-lo
      const clienteOriginal = clientes.find(c => c.id === cliente.id);
      if (clienteOriginal) {
        clienteOriginal[tipo] = valor;
      }
      
      // Se o filtro atual é baseado no status que acabou de mudar, pode ser necessário recarregar
      if (tipo === 'atendeu' && (filtroAtual === 'atendidos' || filtroAtual === 'nao-atendidos')) {
        // Salvar o ID do cliente atual para tentar encontrá-lo após a filtragem
        const clienteAtualId = cliente.id;
        
        // Atualizar localStorage
        localStorage.setItem('clientes', JSON.stringify(clientes));
        
        // Reaplicar filtro
        aplicarFiltro();
        
        // Tentar encontrar o cliente na nova lista filtrada
        const novoIndex = clientesFiltrados.findIndex(c => c.id === clienteAtualId);
        if (novoIndex >= 0) {
          clienteAtualIndex = novoIndex;
          exibirClienteAtual();
        }
      }
    }
  }

  // Atualizar botões de status
  function atualizarBotoesStatus(tipo, valor) {
    let btnSim, btnNao;
    
    switch (tipo) {
      case 'atendeu':
        btnSim = btnAtendeuSimEl;
        btnNao = btnAtendeuNaoEl;
        break;
      case 'atencao':
        btnSim = btnAtencaoSimEl;
        btnNao = btnAtencaoNaoEl;
        break;
      case 'fechamento':
        btnSim = btnFechamentoSimEl;
        btnNao = btnFechamentoNaoEl;
        break;
    }
    
    if (valor) {
      btnSim.classList.add('active');
      btnNao.classList.remove('active');
    } else {
      btnSim.classList.remove('active');
      btnNao.classList.add('active');
    }
  }

  // Salvar atendimento
  function salvarAtendimento() {
    if (clientesFiltrados.length === 0) {
      alert('Não há clientes para salvar.');
      return;
    }
    
    const cliente = clientesFiltrados[clienteAtualIndex];
    
    // Atualizar observações
    cliente.observacoes = txtObservacoesEl.value;
    
    // Encontrar o cliente na lista original e atualizá-lo
    const clienteOriginal = clientes.find(c => c.id === cliente.id);
    if (clienteOriginal) {
      clienteOriginal.observacoes = cliente.observacoes;
    }
    
    // Salvar no localStorage
    localStorage.setItem('clientes', JSON.stringify(clientes));
    
    // Em um ambiente real, aqui faria a chamada para a API
    
    alert('Atendimento salvo com sucesso!');
    
    // Navegar para o próximo cliente automaticamente
    if (clienteAtualIndex < clientesFiltrados.length - 1) {
      navegarParaProximo();
    }
  }
});
