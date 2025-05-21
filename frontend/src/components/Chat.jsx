import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaSmile, FaMicrophone, FaRobot, FaTags, FaTimes } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import TagSelector from './TagSelector';

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

function Chat({ mensagens, onSend, contato, carregando, qrCode, connectionStatus, atendente, onAtendenteChange }) {
  const [novaMensagem, setNovaMensagem] = useState('');
  const [tags, setTags] = useState(contato?.tags || []);
  const [editandoTags, setEditandoTags] = useState(false);
  const messagesEndRef = useRef(null);
  const tagSelectorRef = useRef();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    setTags(contato?.tags || []);
  }, [contato]);

  const handleSend = (e) => {
    e.preventDefault();
    if (novaMensagem.trim()) {
      onSend(novaMensagem);
      setNovaMensagem('');
    }
  };

  const toggleIA = async () => {
    if (!contato) return;
    try {
      const response = await fetch(`/api/contatos/${contato._id}/toggle-ia`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erro ao alternar IA');
      // Atualizar contato selecionado imediatamente
      const contatoAtualizado = await response.json();
      if (contatoAtualizado && contatoAtualizado._id) {
        // Atualiza o estado do contato selecionado no App
        window.dispatchEvent(new CustomEvent('atualizar-contato-selecionado', { detail: contatoAtualizado }));
      }
    } catch (error) {
      console.error('Erro ao alternar IA:', error);
    }
  };

  const handleAtendenteChange = (e) => {
    const novoAtendente = e.target.value;
    onAtendenteChange(contato._id, novoAtendente);
  };

  // Salvar tags no backend
  const handleTagsChange = async (newTags) => {
    setTags(newTags);
    if (!contato) return;
    try {
      await fetch(`/api/contatos/${contato._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags })
      });
      // Atualizar contato selecionado imediatamente
      window.dispatchEvent(new CustomEvent('atualizar-contato-selecionado', { detail: { ...contato, tags: newTags } }));
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
        {/* Ícones de ação - manter só o botão IA */}
        <div className="flex gap-3 text-white/80">
          <button
            onClick={toggleIA}
            className={`p-2 rounded-full transition-colors ${
              contato?.iaAtiva ? 'bg-green-500 text-white' : 'hover:bg-accent'
            }`}
            title={contato?.iaAtiva ? 'IA Ativa' : 'IA Inativa'}
          >
            <FaRobot className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 bg-accent">
        {carregando ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primaryLight"></div>
          </div>
        ) : (
          <>
            {mensagens.map((msg, idx) => (
              <div
                key={idx}
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
                    {new Date(msg.data || msg.createdAt).toLocaleString('pt-BR', {
                      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
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
          disabled={!contato}
        />
        <button
          type="submit"
          className="p-3 bg-primaryLight text-white rounded-full hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center"
          disabled={!contato || !novaMensagem.trim()}
        >
          <FaPaperPlane className="h-5 w-5" />
        </button>
        <button type="button" className="p-2 text-primaryLight hover:bg-accent rounded-full">
          <FaMicrophone className="h-5 w-5" title="Gravar áudio" />
        </button>
      </form>
    </div>
  );
}

export default Chat; 