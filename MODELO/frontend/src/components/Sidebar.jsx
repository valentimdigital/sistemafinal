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

  console.log('[Frontend - Sidebar] Contatos recebidos como prop:', contatos);

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
    <div className="w-80 h-full bg-white border-r border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar contato..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {contatos.map((grupo, index) => (
          <div key={index}>
            <div className="sticky top-0 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">
              {grupo.titulo}
            </div>
            {grupo.contatos.map((contato) => (
              <div
                key={contato._id}
                className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  contatoSelecionado?._id === contato._id ? 'bg-primary/5' : ''
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
                  {/* Tags do sistema */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contato.tags?.map((tag, i) => {
                      const t = TAGS.find(t => t.value === tag);
                      return t ? (
                        <span key={i} style={{ background: t.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 10, fontWeight: 600, textTransform: 'none' }}>{t.label}</span>
                      ) : null;
                    })}
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