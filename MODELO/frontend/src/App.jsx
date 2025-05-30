import React, { useEffect, useState, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import InfoPanel from './components/InfoPanel';
import Topbar from './components/Topbar';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeMotivacional from './pages/HomeMotivacional';
import VendaCadastro from './pages/VendaCadastro';
import VendasLista from './pages/VendasLista';
import Dashboard from './pages/Dashboard';
import Discadora from './components/Discadora';
import DiscadoraRelatorio from './components/DiscadoraRelatorio';
import DiscadoraAdicionarCliente from './components/DiscadoraAdicionarCliente';
import useSocket from './hooks/useSocket';
import { api } from './axiosConfig';

// Lazy loading para melhor performance
const HomeMotivacionalLazy = lazy(() => import('./pages/HomeMotivacional'));
const DashboardLazy = lazy(() => import('./pages/Dashboard'));
const VendaLazy = lazy(() => import('./pages/VendaCadastro'));
const VendasListaLazy = lazy(() => import('./pages/VendasLista'));
const ChatLazy = lazy(() => import('./pages/Chat'));
const DiscadoraLazy = lazy(() => import('./components/Discadora'));
const DiscadoraRelatorioLazy = lazy(() => import('./components/DiscadoraRelatorio'));
const DiscadoraAdicionarClienteLazy = lazy(() => import('./components/DiscadoraAdicionarCliente'));

function AtendimentoApp() {
  const [contatos, setContatos] = useState([]);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastDisconnected, setLastDisconnected] = useState(null);
  const [atendente, setAtendente] = useState('Todos');
  const { 
    socket, 
    conversas, 
    isConnected, 
    qrCode: useSocketQrCode, 
    connectionStatus: useSocketConnectionStatus,
    enviarMensagem, 
    atualizarStatus 
  } = useSocket();

  // Buscar contatos ao carregar e quando receber evento do backend
  const carregarContatos = () => {
    console.log('[Frontend - App] Carregando contatos...');
    fetch('/api/contatos')
      .then(res => {
        console.log('[Frontend - App] Resposta da API /api/contatos:', res);
        if (!res.ok) {
          console.error('[Frontend - App] Erro na resposta da API /api/contatos:', res.status, res.statusText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('[Frontend - App] Contatos recebidos:', data);
        if (!Array.isArray(data)) {
          console.error('[Frontend - App] Dados de contatos inválidos: não é um array', data);
          setContatos([]);
          return;
        }
        setContatos(data);
        // Atualizar contato selecionado se existir
        if (contatoSelecionado) {
          const contatoAtualizado = data.find(c => c._id === contatoSelecionado._id);
          if (contatoAtualizado) {
            setContatoSelecionado(contatoAtualizado);
            console.log('[Frontend - App] Contato selecionado atualizado:', contatoAtualizado);
          } else {
            console.log('[Frontend - App] Contato selecionado não encontrado na lista atualizada.');
          }
        }
      })
      .catch(error => {
        console.error('[Frontend - App] Erro ao carregar contatos:', error);
      });
  };
  useEffect(() => {
    carregarContatos();
    socket?.on('atualizar-contatos', carregarContatos);

    const handleSidebarUpdate = () => carregarContatos();
    window.addEventListener('atualizar-contatos-sidebar', handleSidebarUpdate);

    return () => {
      socket?.off('atualizar-contatos', carregarContatos);
      window.removeEventListener('atualizar-contatos-sidebar', handleSidebarUpdate);
    };
  }, [socket]);

  // Buscar mensagens ao selecionar contato
  useEffect(() => {
    if (contatoSelecionado) {
      console.log('[Frontend - App] Buscando mensagens para contato selecionado:', contatoSelecionado._id);
      setCarregandoMensagens(true);
      fetch(`/api/mensagens/${contatoSelecionado._id}`)
        .then(res => {
          console.log('[Frontend - App] Resposta da API /api/mensagens:', res);
          if (!res.ok) {
            console.error('[Frontend - App] Erro na resposta da API /api/mensagens:', res.status, res.statusText);
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[Frontend - App] Dados de mensagens recebidos:', data);
          if (!data || !Array.isArray(data.mensagens)) {
            console.error('[Frontend - App] Formato de dados de mensagens inválido:', data);
            setMensagens([]); // Garantir que seja um array vazio em caso de erro
            // Aqui você pode querer também atualizar o estado hasMore, total, etc. se eles estiverem no App.jsx
          } else {
            // Definir o estado com o array de mensagens recebido do backend
            setMensagens(data.mensagens);
            console.log(`[Frontend - App] ${data.mensagens.length} mensagens carregadas.`);
            // Atualizar outros estados de paginação se aplicável
          }
          setCarregandoMensagens(false);
        })
        .catch(error => {
          console.error('[Frontend - App] Erro ao buscar mensagens:', error);
          setMensagens([]); // Garantir que seja um array vazio em caso de erro na requisição
          setCarregandoMensagens(false);
        });
    } else {
      console.log('[Frontend - App] Contato selecionado é nulo, limpando mensagens.');
      setMensagens([]);
    }
  }, [contatoSelecionado]); // Dependência: contatoSelecionado

  // Receber mensagem em tempo real e atualizar contato selecionado
  useEffect(() => {
    const handleNovaMensagem = ({ contatoId, mensagem }) => {
      console.log('[Frontend - App] Socket.IO - nova-mensagem recebida para contato', contatoId, ':', mensagem);
      // Adicionar a nova mensagem APENAS se o contato da mensagem for o contato selecionado no momento
      if (contatoSelecionado && contatoSelecionado._id === contatoId) {
        console.log('[Frontend - App] Adicionando nova mensagem ao chat...');
        // Garantir que o estado anterior `prev` é um array antes de adicionar a nova mensagem
        setMensagens(prev => {
          if (!Array.isArray(prev)) {
            console.warn('[Frontend - App] Estado de mensagens inválido (não é array), substituindo por array com nova mensagem.', prev);
            return [mensagem]; // Substituir o estado inválido por um novo array com a mensagem
          }
          // Evitar duplicatas, verificar se a mensagem já existe pelo _id
          const mensagemExiste = prev.some(msg => msg._id === mensagem._id);
          if (mensagemExiste) {
            console.log('[Frontend - App] Mensagem já existe no estado, ignorando.', mensagem);
            return prev; // Retorna o estado atual sem adicionar a duplicata
          }
          return [...prev, mensagem]; // Adiciona a nova mensagem ao array existente
        });
        // Opcional: Atualizar contato selecionado aqui se o recebimento de msg alterar seus dados
        // (ex: iaAtiva, status, etc.) - Isso já é feito no Chat.jsx, pode não ser necessário aqui
        // fetch(`/api/contatos/${contatoId}`)... (buscando contato específico seria mais eficiente)
      }
      // Atualiza a lista de contatos na sidebar para refletir a última mensagem (ordenação)
      console.log('[Frontend - App] Emitindo evento para atualizar a lista de contatos na sidebar.');
      carregarContatos(); // Recarrega a lista completa de contatos para reordenar
    };

    socket?.on('nova-mensagem', handleNovaMensagem);

    return () => {
      socket?.off('nova-mensagem', handleNovaMensagem);
    };
  }, [contatoSelecionado, contatos]); // Adicionar 'contatos' como dependência para carregarContatos

  // Gerenciar QR Code e status da conexão
  useEffect(() => {
    let disconnectTimer = null;
    socket?.on('connect', () => {
      console.log('Conectado ao servidor');
    });

    socket?.on('connect_error', (error) => {
      console.error('Erro ao conectar:', error);
    });

    socket?.on('qr-code', ({ qr }) => {
      console.log('QR Code recebido');
      setQrCode(qr);
    });

    socket?.on('connection-status', ({ status }) => {
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
      socket?.off('connect');
      socket?.off('connect_error');
      socket?.off('qr-code');
      socket?.off('connection-status');
      if (disconnectTimer) clearTimeout(disconnectTimer);
    };
  }, [socket]);

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

  useEffect(() => {
    // Carregar conversas iniciais
    const carregarConversas = async () => {
      try {
        const response = await api.get('/atendimentos/conversas');
        // Atualizar o estado das conversas com os dados do backend
        setConversas(response.data);
      } catch (error) {
        console.error('Erro ao carregar conversas:', error);
      }
    };

    carregarConversas();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#181C2A] via-[#232946] to-[#181C2A]">
      <Topbar
        atendente={atendente}
        setAtendente={setAtendente}
        contatoSelecionado={contatoSelecionado}
        onAtribuirAtendente={() => {
          if (contatoSelecionado && atendente !== 'Todos') {
            handleAtendenteChange(contatoSelecionado._id, atendente);
          }
        }}
      />
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
            onAtendenteChange={handleAtendenteChange}
          />
        </div>
        {/* InfoPanel: largura fixa, sem ocupar espaço extra */}
        <div className="hidden lg:flex flex-col w-[400px] min-w-[340px] max-w-[440px] h-full border-l border-border bg-accent">
          <InfoPanel contato={contatoSelecionado} totalMensagens={mensagens.length} />
        </div>
      </div>
      {!isConnected && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
          Desconectado do servidor. Tentando reconectar...
        </div>
      )}
    </div>
  );
}

// Componente de loading
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#10121A] via-[#181C2A] to-[#0A0C13]">
    <div className="text-white text-xl">Carregando...</div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<AtendimentoApp />} />
          <Route path="/dashboard" element={<DashboardLazy />} />
          <Route path="/venda" element={<VendaLazy />} />
          <Route path="/vendas" element={<VendasListaLazy />} />
          <Route path="/home" element={<HomeMotivacionalLazy />} />
          <Route path="/discadora/atendimento" element={<DiscadoraLazy />} />
          <Route path="/discadora/relatorio" element={<DiscadoraRelatorioLazy />} />
          <Route path="/discadora/adicionarcliente" element={<DiscadoraAdicionarClienteLazy />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App; 