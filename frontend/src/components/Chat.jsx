import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaSmile, FaMicrophone, FaRobot, FaTags, FaTimes } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import TagSelector from './TagSelector';
import io from 'socket.io-client';
import axios from 'axios';

const ATENDENTES = [
  'Todos',
  'Wellington Ribeiro',
  'Ana Cunha',
  'Thayná Freitas',
  'Livia Martins',
  'Valentim',
  'Valentina (IA)'
];

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

function Chat({ mensagens: mensagensIniciais, onSend, contato, carregando, qrCode, connectionStatus, atendente, onAtendenteChange }) {
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [tags, setTags] = useState(contato?.tags || []);
  const [editandoTags, setEditandoTags] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const messagesEndRef = useRef(null);
  const tagSelectorRef = useRef();
  const [socket, setSocket] = useState(null);
  const [isAIActive, setIsAIActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mensagensCache = useRef(new Map());

  // Carregar mensagens do contato quando ele muda
  useEffect(() => {
    if (contato?._id) {
      setIsLoading(true);
      carregarMensagens(contato._id);
    }
  }, [contato?._id]);

  // Carregar mensagens do contato via API com cache
  const carregarMensagens = async (contatoId) => {
    try {
      // Verificar cache
      if (mensagensCache.current.has(contatoId)) {
        const cachedData = mensagensCache.current.get(contatoId);
        if (Date.now() - cachedData.timestamp < 30000) { // 30 segundos
          setMensagens(cachedData.mensagens);
          setIsLoading(false);
          return;
        }
      }

      const response = await axios.get(`http://localhost:3001/api/mensagens/${contatoId}`, {
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      const mensagensOrdenadas = response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );

      // Atualizar cache
      mensagensCache.current.set(contatoId, {
        mensagens: mensagensOrdenadas,
        timestamp: Date.now()
      });

      setMensagens(mensagensOrdenadas);
    } catch (error) {
      console.error('[Frontend - Chat] Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll para última mensagem quando mensagens são atualizadas
  useEffect(() => {
    // Use setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [mensagens]);

  // Atualizar tags quando mudar o contato
  useEffect(() => {
    setTags(contato?.tags || []);
  }, [contato]);

  // Configurar Socket.IO e listeners
  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    setSocket(newSocket);

    // Listener para novas mensagens
    newSocket.on('nova-mensagem', (data) => {
      if (data.contatoId === contato?._id) {
        setMensagens(prev => {
          const novasMensagens = [...prev, data.mensagem];
          // Atualizar cache
          if (mensagensCache.current.has(data.contatoId)) {
            mensagensCache.current.set(data.contatoId, {
              mensagens: novasMensagens,
              timestamp: Date.now()
            });
          }
          return novasMensagens;
        });
      }
    });

    // Listener para atualizações de status
    newSocket.on('mensagem-status', (data) => {
      setMensagens(prev => 
        prev.map(msg => 
          msg._id === data.id ? { ...msg, status: data.status } : msg
        )
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, [contato?._id]);

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of mensagensCache.current.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutos
          mensagensCache.current.delete(key);
        }
      }
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  // Lidar com o envio de mensagem
  const handleSend = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !contato || enviando) return;

    setEnviando(true);
    const mensagemConteudo = novaMensagem;
    setNovaMensagem('');

    try {
      const response = await axios.post('http://localhost:3001/api/mensagens', {
        contatoId: contato._id,
        de: 'atendente',
        para: contato.numero,
        conteudo: mensagemConteudo,
        tipo: 'text'
      }, {
        timeout: 5000
      });

      // Adicionar mensagem ao cache imediatamente
      setMensagens(prev => {
        const novasMensagens = [...prev, response.data];
        mensagensCache.current.set(contato._id, {
          mensagens: novasMensagens,
          timestamp: Date.now()
        });
        return novasMensagens;
      });

    } catch (error) {
      console.error('[Frontend - Chat] Erro ao enviar mensagem:', error);
      alert(error.response?.status === 503 
        ? 'WhatsApp não está conectado. Por favor, escaneie o QR Code novamente.'
        : 'Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const toggleIA = async () => {
    try {
      const response = await axios.post('http://localhost:3001/api/ia/toggle', {}, {
        timeout: 3000
      });
      setIsAIActive(response.data.isActive);
    } catch (error) {
      console.error('Erro ao alternar estado da IA:', error);
    }
  };

  const handleAtendenteChange = (e) => {
    const novoAtendente = e.target.value;
    onAtendenteChange(contato._id, novoAtendente);
  };

  const handleTagsChange = async (newTags) => {
    setTags(newTags);
    if (!contato) return;
    try {
      await fetch(`/api/contatos/${contato._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      });
      window.dispatchEvent(new CustomEvent('atualizar-contato-selecionado', { 
        detail: { ...contato, tags: newTags } 
      }));
    } catch (err) {
      console.error('Erro ao salvar tags:', err);
    }
  };

  // Fechar TagSelector ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target)) {
        setEditandoTags(false);
      }
    }
    if (editandoTags) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editandoTags]);

  // Renderiza o QR Code quando necessário
  const renderQRCode = () => {
    if (!qrCode) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl text-center">
          <h3 className="text-lg font-semibold mb-4">Conecte seu WhatsApp</h3>
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG value={qrCode} size={256} />
          </div>
          <p className="text-sm text-gray-600">
            Escaneie o QR Code com seu WhatsApp para conectar
          </p>
        </div>
      </div>
    );
  };

  // Renderização otimizada das mensagens
  const renderMensagens = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryLight"></div>
        </div>
      );
    }

    return (
      <>
        <div ref={messagesEndRef} />
        {mensagens.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`mb-4 flex ${msg.de === contato?.numero ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[70%] shadow text-sm break-words ${
                msg.de === contato?.numero
                  ? 'bg-primaryLighter text-primary rounded-bl-none'
                  : 'bg-primary text-white rounded-br-none'
              }`}
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
            >
              <div>{msg.conteudo}</div>
              <div className="text-[10px] text-white/70 mt-1 text-right">
                {(msg.data || msg.createdAt) ? new Date(msg.data || msg.createdAt).toLocaleString('pt-BR', {
                  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                }) : 'Data desconhecida'}
                {msg.status && msg.de !== contato?.numero && (
                  <span className="ml-2 text-[8px]">
                    {
                      msg.status === 'sending' ? 'Enviando...' :
                      msg.status === 'sent' ? 'Enviado' :
                      msg.status === 'delivered' ? 'Entregue' :
                      msg.status === 'read' ? 'Lido' :
                      msg.status === 'error' ? 'Erro' : ''
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-accent h-full">
      {renderQRCode()}
      
      {/* Cabeçalho do Chat */}
      <div className="p-4 border-b border-border bg-primary flex items-center gap-3 shadow-sm">
        <img
          src={contato?.avatar || `https://ui-avatars.com/api/?name=${contato?.nome}`}
          alt="Avatar"
          className="w-12 h-12 rounded-full border-2 border-primaryLight"
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="font-semibold text-white text-lg truncate">{contato?.nome || 'Selecione um contato'}</h3>
          <div className="text-xs text-white/70 mt-0.5">{contato?.numero}</div>
        </div>
        {/* Botão da IA */}
        <button
          onClick={toggleIA}
          className={`px-3 py-1 rounded-full text-xs font-bold shadow border ${
            isAIActive 
              ? 'bg-green-500 text-white border-green-600' 
              : 'bg-red-500 text-white border-red-600'
          }`}
        >
          {isAIActive ? 'IA Ativa' : 'IA Inativa'}
        </button>
        {/* Dropdown de atendente */}
        {contato && (
          <select
            className="ml-2 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow border border-primaryLight whitespace-nowrap focus:outline-none"
            value={contato.atendente || atendente}
            onChange={handleAtendenteChange}
          >
            {ATENDENTES.map(nome => (
              <option key={nome} value={nome}>{nome}</option>
            ))}
          </select>
        )}
        {/* Badges de tags e botão para editar */}
        {contato && (
          <div className="ml-2 relative flex flex-col items-end max-w-[60vw]">
            <div
              className="flex gap-1 mb-1 w-full justify-end overflow-x-auto scrollbar-thin scrollbar-thumb-primaryLight scrollbar-track-transparent"
              style={{ maxWidth: '60vw', whiteSpace: 'nowrap', paddingBottom: 2 }}
            >
              {tags.map(tag => {
                const t = TAGS.find(t => t.value === tag);
                return t ? (
                  <span key={tag} style={{ background: t.color, color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>{t.label}</span>
                ) : null;
              })}
              <button
                className="ml-1 p-1 rounded-full bg-white/20 hover:bg-white/40 text-primaryLight self-center"
                title="Editar tags"
                onClick={() => setEditandoTags(v => !v)}
                style={{ minWidth: 32 }}
              >
                <FaTags />
              </button>
            </div>
            {editandoTags && (
              <div ref={tagSelectorRef} className="absolute z-50 top-10 right-0 bg-white rounded shadow-lg p-2 min-w-[200px]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-primary text-sm">Editar tags</span>
                  <button onClick={() => setEditandoTags(false)} className="text-gray-400 hover:text-red-500"><FaTimes /></button>
                </div>
                <TagSelector value={tags} onChange={handleTagsChange} />
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 bg-accent flex flex-col-reverse">
        {renderMensagens()}
      </div>
      {/* Input de Mensagem */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card flex gap-2 items-center">
        <button type="button" className="p-2 text-primaryLight hover:bg-accent rounded-full">
          <FaSmile className="h-5 w-5" title="Emoji" />
        </button>
        <button type="button" className="p-2 text-primaryLight hover:bg-accent rounded-full">
          <FaPaperclip className="h-5 w-5" title="Anexar arquivo" />
        </button>
        <input
          type="text"
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          className="flex-1 p-3 border border-border rounded-full focus:outline-none focus:border-primaryLight bg-accent text-primary"
          placeholder="Digite sua mensagem..."
          disabled={!contato || enviando}
        />
        <button
          type="submit"
          className="p-3 bg-primaryLight text-white rounded-full hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center"
          disabled={!contato || !novaMensagem.trim() || enviando}
        >
          {enviando ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <FaPaperPlane className="h-5 w-5" />
          )}
        </button>
        <button type="button" className="p-2 text-primaryLight hover:bg-accent rounded-full">
          <FaMicrophone className="h-5 w-5" title="Gravar áudio" />
        </button>
      </form>
    </div>
  );
}

export default Chat; 