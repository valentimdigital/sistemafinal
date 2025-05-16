import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import InfoPanel from './components/InfoPanel';
import Topbar from './components/Topbar';
import { io } from 'socket.io-client';

// Atualizar a URL do backend para usar caminho relativo
const socket = io('/', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

// Expor socket globalmente para uso em outros componentes
window.socket = socket;

function App() {
  const [contatos, setContatos] = useState([]);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastDisconnected, setLastDisconnected] = useState(null);
  const [atendente, setAtendente] = useState('Todos');

  // Buscar contatos ao carregar e quando receber evento do backend
  const carregarContatos = () => {
    fetch('/api/contatos')
      .then(res => res.json())
      .then(data => {
        setContatos(data);
        // Atualizar contato selecionado se existir
        if (contatoSelecionado) {
          const contatoAtualizado = data.find(c => c._id === contatoSelecionado._id);
          if (contatoAtualizado) {
            setContatoSelecionado(contatoAtualizado);
          }
        }
      });
  };
  useEffect(() => {
    carregarContatos();
    socket.on('atualizar-contatos', carregarContatos);
    return () => {
      socket.off('atualizar-contatos', carregarContatos);
    };
  }, []);

  // Buscar mensagens ao selecionar contato
  useEffect(() => {
    if (contatoSelecionado) {
      setCarregandoMensagens(true);
      fetch(`/api/mensagens/${contatoSelecionado._id}`)
        .then(res => res.json())
        .then(data => {
          setMensagens(data);
          setCarregandoMensagens(false);
        });
    } else {
      setMensagens([]);
    }
  }, [contatoSelecionado]);

  // Receber mensagem em tempo real e atualizar contato selecionado
  useEffect(() => {
    const handleNovaMensagem = ({ contatoId, mensagem }) => {
      if (contatoSelecionado && contatoSelecionado._id === contatoId) {
        setMensagens(prev => [...prev, mensagem]);
        // Atualizar contato selecionado (ex: iaAtiva, nome, avatar, etc)
        fetch(`/api/contatos`)
          .then(res => res.json())
          .then(data => {
            const contatoAtualizado = data.find(c => c._id === contatoSelecionado._id);
            if (contatoAtualizado) {
              setContatoSelecionado(contatoAtualizado);
            }
          });
      }
      // Atualiza contatos para refletir última mensagem
      carregarContatos();
    };
    socket.on('nova-mensagem', handleNovaMensagem);
    return () => {
      socket.off('nova-mensagem', handleNovaMensagem);
    };
  }, [contatoSelecionado]);

  // Gerenciar QR Code e status da conexão
  useEffect(() => {
    let disconnectTimer = null;
    socket.on('connect', () => {
      console.log('Conectado ao servidor');
    });

    socket.on('connect_error', (error) => {
      console.error('Erro ao conectar:', error);
    });

    socket.on('qr-code', ({ qr }) => {
      console.log('QR Code recebido');
      setQrCode(qr);
    });

    socket.on('connection-status', ({ status }) => {
      console.log('Status da conexão:', status);
      if (status === 'open') {
        setConnectionStatus('open');
        setLastDisconnected(null);
        if (disconnectTimer) clearTimeout(disconnectTimer);
      } else if (status === 'close') {
        setConnectionStatus('reconnecting');
        setLastDisconnected(Date.now());
        if (disconnectTimer) clearTimeout(disconnectTimer);
        disconnectTimer = setTimeout(() => {
          setConnectionStatus('close');
        }, 60000); // 1 minuto
      } else {
        setConnectionStatus('connecting');
        setLastDisconnected(null);
        if (disconnectTimer) clearTimeout(disconnectTimer);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('qr-code');
      socket.off('connection-status');
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, []);

  // Enviar mensagem
  const handleSend = async (texto) => {
    if (!contatoSelecionado) return;
    const novaMsg = {
      contatoId: contatoSelecionado._id,
      de: 'operador', // ajuste conforme autenticação
      para: contatoSelecionado.numero,
      conteudo: texto,
      tipo: 'text',
      protocolo: contatoSelecionado.protocolo || ''
    };
    const res = await fetch('/api/mensagens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaMsg)
    });
    const msgSalva = await res.json();
    setMensagens(prev => [...prev, msgSalva]);
  };

  const handleAtendenteChange = async (contatoId, novoAtendente) => {
    try {
      const response = await fetch(`/api/contatos/${contatoId}/atendente`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atendente: novoAtendente })
      });
      if (!response.ok) throw new Error('Falha ao atualizar atendente');
      const contatoAtualizado = await response.json();
      // Atualizar o contato selecionado com o valor do banco
      setContatoSelecionado(contatoAtualizado);
      // Atualizar a lista de contatos para refletir o novo atendente
      setContatos(prevContatos => prevContatos.map(c => c._id === contatoId ? contatoAtualizado : c));
    } catch (error) {
      console.error('Erro ao atualizar atendente:', error);
    }
  };

  useEffect(() => {
    const atualizarContatoSelecionado = (e) => {
      setContatoSelecionado(e.detail);
    };
    window.addEventListener('atualizar-contato-selecionado', atualizarContatoSelecionado);

    // Novo: atualizar atendente do contato
    const atualizarAtendenteContato = (e) => {
      const { contatoId, atendente: novoAtendente } = e.detail;
      setContatos(prevContatos => prevContatos.map(c =>
        c._id === contatoId ? { ...c, atendente: novoAtendente } : c
      ));
      if (contatoSelecionado && contatoSelecionado._id === contatoId) {
        setContatoSelecionado({ ...contatoSelecionado, atendente: novoAtendente });
      }
    };
    window.addEventListener('atualizar-atendente-contato', atualizarAtendenteContato);

    return () => {
      window.removeEventListener('atualizar-contato-selecionado', atualizarContatoSelecionado);
      window.removeEventListener('atualizar-atendente-contato', atualizarAtendenteContato);
    };
  }, [contatoSelecionado]);

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5]">
      <Topbar atendente={atendente} setAtendente={setAtendente} />
      <div className="flex flex-1 min-h-0 h-full">
        {/* Sidebar: altura total */}
        <div className="hidden md:flex flex-col w-[360px] min-w-[320px] max-w-[400px] h-full bg-card">
          <Sidebar
            contatos={contatos}
            onSelect={setContatoSelecionado}
            contatoSelecionado={contatoSelecionado}
            connectionStatus={connectionStatus}
            atendente={atendente}
          />
        </div>
        {/* Chat: altura total */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          <Chat
            mensagens={mensagens}
            onSend={handleSend}
            contato={contatoSelecionado}
            carregando={carregandoMensagens}
            qrCode={qrCode}
            connectionStatus={connectionStatus}
            atendente={atendente}
          />
        </div>
        {/* InfoPanel: largura fixa, sem ocupar espaço extra */}
        <div className="hidden lg:flex flex-col w-[400px] min-w-[340px] max-w-[440px] h-full border-l border-border bg-accent">
          <InfoPanel contato={contatoSelecionado} totalMensagens={mensagens.length} />
        </div>
      </div>
    </div>
  );
}

export default App; 