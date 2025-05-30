import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaPaperclip, FaExclamationCircle, FaSync, FaQrcode } from 'react-icons/fa';

const TAGS = [
  { label: 'Precisa do CNPJ', value: 'precisa_cnpj', color: '#f59e42' },
  { label: 'Com dívida', value: 'com_divida', color: '#ef4444' },
  { label: 'Com limite', value: 'com_limite', color: '#22c55e' },
  { label: 'CNPJ', value: 'cnpj', color: '#2563eb' },
  { label: 'PF', value: 'pf', color: '#a21caf' },
  { label: 'Fibra', value: 'fibra', color: '#06b6d4' },
  { label: 'Sem viabilidade', value: 'sem_viabilidade', color: '#64748b' },
  { label: 'Com via', value: 'com_via', color: '#eab308' },
];

function Sidebar({ contatos, onSelect, contatoSelecionado, connectionStatus, atendente }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('ativos');

  // Atualização automática da lista de contatos ao receber nova mensagem OU ao abrir a tela
  useEffect(() => {
    const atualizarContatos = () => {
      window.dispatchEvent(new CustomEvent('atualizar-contatos-sidebar'));
    };
    // Atualiza ao abrir a tela
    atualizarContatos();
    if (window.socket) {
      window.socket.on('nova-mensagem', atualizarContatos);
    }
    return () => {
      if (window.socket) {
        window.socket.off('nova-mensagem', atualizarContatos);
      }
    };
  }, []);

  // Filtros customizados
  const contatosFiltrados = contatos.filter(c => {
    const nomeMatch = (c.nome ? c.nome.toLowerCase() : '').includes(busca.toLowerCase());
    const numeroMatch = (c.numero ? c.numero : '').includes(busca);
    let filtroMatch = true;
    if (filtro === 'iaon') filtroMatch = c.iaAtiva === true;
    if (filtro === 'humano') filtroMatch = c.iaAtiva === false;
    // Filtro por atendente
    if (!atendente || atendente === 'Todos') {
      return (nomeMatch || numeroMatch) && filtroMatch;
    } else {
      return (nomeMatch || numeroMatch) && filtroMatch && c.atendente === atendente;
    }
  });

  // Exemplo de separação de grupos (ativos, pendentes, potenciais)
  const grupos = [
    { nome: 'Ativos', cor: 'primary', contatos: contatosFiltrados },
    // Adicione outros grupos se quiser separar por status
  ];

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'open':
        return 'text-green-500';
      case 'close':
        return 'text-red-500';
      case 'reconnecting':
        return 'text-yellow-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'open':
        return 'Conectado';
      case 'close':
        return 'Desconectado';
      case 'reconnecting':
        return 'Reconectando...';
      default:
        return 'Conectando...';
    }
  };

  const handleGerarQR = () => {
    // Emitir evento para o backend gerar novo QR Code
    window.socket.emit('gerar-qr');
  };

  return (
    <div className="flex flex-col h-full w-full bg-card">
      <div className="p-4 border-b border-border bg-primary flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Conversas</h2>
          {/* Botão de atualizar */}
          <button
            className="ml-2 p-2 rounded-full bg-accent text-primary hover:bg-primaryLight hover:text-white transition"
            title="Atualizar lista de contatos"
            onClick={() => window.dispatchEvent(new CustomEvent('atualizar-contatos-sidebar'))}
          >
            <FaSync />
          </button>
        </div>
        {/* Filtros */}
        <div className="flex gap-2 mt-2 mb-2">
          <button
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filtro === 'ativos' ? 'bg-primary text-white' : 'bg-accent text-primary'}`}
            onClick={() => setFiltro('ativos')}
          >Ativos</button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filtro === 'iaon' ? 'bg-green-500 text-white' : 'bg-accent text-primary'}`}
            onClick={() => setFiltro('iaon')}
          >IA ON</button>
          <button
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${filtro === 'humano' ? 'bg-yellow-500 text-white' : 'bg-accent text-primary'}`}
            onClick={() => setFiltro('humano')}
          >HUMANO</button>
        </div>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar contato..."
          className="w-full p-2 rounded bg-accent text-primary placeholder:text-primary/60 focus:outline-none"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {grupos.map(grupo => (
          <div key={grupo.nome}>
            <div className={`px-4 py-2 text-xs font-bold text-primaryLight bg-accent border-b border-border sticky top-0 z-10`}>{grupo.nome}</div>
            {grupo.contatos.length === 0 && (
              <div className="text-primaryLight/60 text-center mt-8">Nenhum contato encontrado</div>
            )}
            {grupo.contatos.map((contato) => (
              <div
                key={contato._id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border transition-colors duration-150 ${
                  contatoSelecionado && contatoSelecionado._id === contato._id
                    ? 'bg-primaryLighter/10' : 'hover:bg-primaryLighter/10'
                }`}
                onClick={() => onSelect(contato)}
              >
                <img
                  src={contato.avatar || `https://ui-avatars.com/api/?name=${contato.nome}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full border-2 border-primaryLight"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary truncate">{contato.nome}</span>
                    <FaWhatsapp className="text-whatsapp" title="WhatsApp" />
                  </div>
                  <div className="text-xs text-primaryLight/70 truncate">{contato.numero}</div>
                  {/* Exemplo de tags/status */}
                  <div className="flex gap-1 mt-1">
                    {contato.tags?.map((tag, i) => {
                      const t = TAGS.find(t => t.value === tag);
                      return t ? (
                        <span key={i} style={{ background: t.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'none' }}>{t.label}</span>
                      ) : (
                      <span key={i} className="bg-tag text-tagText text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">{tag}</span>
                      );
                    })}
                    {/* Exemplo de ícones de status */}
                    {contato.status === 'pendente' && <FaExclamationCircle className="text-yellow-500 ml-1" title="Pendente" />} 
                    {contato.status === 'anexo' && <FaPaperclip className="text-primaryLight ml-1" title="Anexo" />} 
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar; 