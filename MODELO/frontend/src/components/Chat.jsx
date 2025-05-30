import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaSmile, FaMicrophone, FaRobot, FaTags, FaTimes } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import TagSelector from './TagSelector';
import io from 'socket.io-client';
import axios from 'axios';
import { listarConversas, buscarMensagens } from '../services/conversasService';

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
  const [mensagensCarregadas, setMensagensCarregadas] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MESSAGES_PER_PAGE = 50;
  const [mensagensComErro, setMensagensComErro] = useState(new Map());
  const MAX_RETRIES = 3;

  // Carregar mensagens do contato quando ele muda
  useEffect(() => {
    if (contato?._id) {
      console.log('[Frontend - Chat] Contato selecionado mudou, resetando estados de mensagens...');
      setIsLoading(true);
      setMensagensCarregadas(false);
      setMensagens([]); // Limpar mensagens ao mudar de contato
      setPage(1); // Resetar paginação
      setHasMore(true); // Assumir que há mais mensagens para carregar inicialmente
      setMensagensComErro(new Map()); // Limpar mensagens com erro
      mensagensCache.current.clear(); // Limpar cache
      carregarMensagens(contato._id);
    }
  }, [contato?._id]);

  // Função para carregar mensagens com paginação
  const carregarMensagens = async (contatoId, pageNum = 1) => {
    try {
      console.log(`[Frontend - Chat] Iniciando carregamento de mensagens para ${contatoId}, página ${pageNum}`);
      setLoadingMore(true);
      
      // Verificar cache
      const cacheKey = `${contatoId}-${pageNum}`;
      if (mensagensCache.current.has(cacheKey)) {
        const cachedData = mensagensCache.current.get(cacheKey);
        if (Date.now() - cachedData.timestamp < 30000) { // 30 segundos
          console.log(`[Frontend - Chat] Carregando mensagens da página ${pageNum} do cache para ${contatoId}.`);
          setMensagens(prev => {
            const newMessages = [...cachedData.mensagens];
            if (pageNum > 1) {
              const filteredNewMessages = newMessages.filter(newMessage => 
                !prev.some(existingMessage => existingMessage._id === newMessage._id)
              );
              return [...prev, ...filteredNewMessages];
            }
            return newMessages;
          });
          setHasMore(cachedData.hasMore);
          setLoadingMore(false);
          console.log(`[Frontend - Chat] Mensagens da página ${pageNum} carregadas do cache. Total no estado: ${mensagens.length}. HasMore: ${cachedData.hasMore}`);
          return;
        }
      }

      console.log(`[Frontend - Chat] Buscando mensagens da API para ${contatoId}, página ${pageNum}`);

      // Tenta primeiro buscar do Baileys
      try {
        const response = await buscarMensagens(contatoId, pageNum, MESSAGES_PER_PAGE);
        if (response.success) {
          const { mensagens: mensagensRecebidas, hasMore: temMais } = response;
          
          // Atualizar cache
          mensagensCache.current.set(cacheKey, {
            mensagens: mensagensRecebidas,
            timestamp: Date.now(),
            hasMore: temMais
          });

          setMensagens(prev => {
            if (pageNum > 1) {
              const filteredNewMessages = mensagensRecebidas.filter(newMsg => 
                !prev.some(existingMsg => existingMsg._id === newMsg._id)
              );
              return [...prev, ...filteredNewMessages];
            }
            return mensagensRecebidas;
          });

          setHasMore(temMais);
          if (pageNum === 1) {
            setMensagensCarregadas(true);
            setIsLoading(false);
          }
          return;
        }
      } catch (error) {
        console.warn('Erro ao buscar mensagens do Baileys, tentando MongoDB:', error);
      }

      // Se não encontrou no Baileys, tenta buscar do MongoDB
      const response = await axios.get(`http://localhost:3001/api/mensagens/${contatoId}`, {
        params: {
          page: pageNum,
          limit: MESSAGES_PER_PAGE
        }
      });

      console.log('[Frontend - Chat] Resposta da API /api/mensagens/:contatoId recebida:', response.data);

      if (!response.data) {
        console.error('[Frontend - Chat] Resposta vazia da API');
        setMensagens([]);
        setHasMore(false);
        return;
      }

      const { mensagens: mensagensRecebidas, hasMore: temMais } = response.data;

      if (!Array.isArray(mensagensRecebidas)) {
        console.error('[Frontend - Chat] Formato de resposta inválido (mensagens não é array): ', response.data);
        setMensagens([]);
        setHasMore(false);
        return;
      }

      // Garantir que todas as mensagens têm os campos necessários e converter _id para string
      const mensagensValidas = mensagensRecebidas.map(msg => {
        // Clonar para evitar modificar o objeto original do Mongoose/Lean
        const msgCopy = { ...msg };

        // Garantir que _id seja string e outros campos existam
        msgCopy._id = msgCopy._id?.toString() || '';
        msgCopy.contato = msgCopy.contato?.toString() || ''; // Garantir contato como string
        msgCopy.de = msgCopy.de || '';
        msgCopy.para = msgCopy.para || '';
        msgCopy.conteudo = msgCopy.conteudo || '';
        msgCopy.tipo = msgCopy.tipo || 'text';
        msgCopy.status = msgCopy.status || 'sending';
        msgCopy.data = msgCopy.data || msgCopy.createdAt || new Date();
        msgCopy.createdAt = msgCopy.createdAt || msgCopy.data || new Date();
        msgCopy.updatedAt = msgCopy.updatedAt || new Date();
        msgCopy.metadados = msgCopy.metadados || {};

        // Validar campos obrigatórios
        const isValid = msgCopy._id && 
          msgCopy.conteudo && 
          msgCopy.de && 
          msgCopy.para;

        if (!isValid) {
          console.warn('[Frontend - Chat] Mensagem inválida encontrada (validação): ', msg);
        }

        return isValid ? msgCopy : null;
      }).filter(Boolean); // Remover mensagens inválidas

      if (mensagensValidas.length === 0) {
        console.warn('[Frontend - Chat] Nenhuma mensagem válida encontrada após validação.');
        // Se for a primeira página e não houver mensagens válidas, limpar o estado
        if (pageNum === 1) {
           setMensagens([]);
        }
        setHasMore(false); // Não há mais mensagens válidas
        return;
      }

      console.log(`[Frontend - Chat] ${mensagensValidas.length} mensagens válidas processadas.`);

      // Ordenar as mensagens válidas por data (ascendente para exibir em ordem no chat)
      const mensagensOrdenadas = mensagensValidas.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.data);
        const dateB = new Date(b.createdAt || b.data);
        return dateA - dateB;
      });

      // Atualizar cache com mensagens ordenadas
      mensagensCache.current.set(cacheKey, {
        mensagens: mensagensOrdenadas,
        timestamp: Date.now(),
        hasMore: temMais
      });

      setMensagens(prev => {
        // Se for a primeira página, substituir. Se for página > 1, concatenar.
        if (pageNum > 1) {
          // Filtrar duplicatas antes de concatenar
          const filteredNewMessages = mensagensOrdenadas.filter(orderedMsg => 
             !prev.some(existingMsg => existingMsg._id === orderedMsg._id)
          );
          console.log(`[Frontend - Chat] Concatenando página ${pageNum}. Adicionando ${filteredNewMessages.length} novas mensagens (após filtro de duplicatas).`);
          return [...prev, ...filteredNewMessages];
        }
        console.log(`[Frontend - Chat] Definindo mensagens para a primeira página. Total: ${mensagensOrdenadas.length}`);
        return mensagensOrdenadas;
      });

      setHasMore(temMais);
      // Marcamos como carregadas apenas após carregar a primeira página
      if (pageNum === 1) {
        setMensagensCarregadas(true);
        setIsLoading(false); // Finaliza o loading geral após a primeira página
      }

    } catch (error) {
      console.error('[Frontend - Chat] Erro ao carregar mensagens:', error);
      const errorMessage = error.response?.data?.error || 'Erro ao carregar mensagens';
      alert(errorMessage);
      // Em caso de erro, garantir que o estado de mensagens seja um array, mesmo que vazio
      if (pageNum === 1) {
         setMensagens([]);
         setMensagensCarregadas(true); // Marcar como carregadas mesmo com erro para parar loading
      }
      setHasMore(false); // Não há mais mensagens para carregar se deu erro
    } finally {
      setLoadingMore(false);
      // Se for a primeira página, o loading geral também finaliza aqui no finally, garantindo que o spinner suma.
      if (pageNum === 1) {
         setIsLoading(false);
      }
    }
  };

  // Função para carregar mais mensagens (scroll infinito)
  const carregarMaisMensagens = () => {
    if (!hasMore || loadingMore || !contato?._id) {
      console.log('[Frontend - Chat] Não é possível carregar mais mensagens (hasMore, loadingMore ou contato faltando):', { hasMore, loadingMore, contato: !!contato?._id });
      return;
    }
    console.log(`[Frontend - Chat] Solicitando carregar mais mensagens (Página ${page + 1})...`);
    // page já foi incrementado no useEffect do observer, usar page + 1 ou o estado atualizado do page?
    // Melhor usar o estado atualizado do page diretamente aqui
    carregarMensagens(contato._id, page + 1);
  };

  // Observer para scroll infinito - Atualizado para usar o estado 'page'
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Se o gatilho está visível, tem mais mensagens e não está carregando
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          console.log('[Frontend - Chat] Gatilho de scroll visível, carregando próxima página...');
          setPage(prevPage => prevPage + 1); // Incrementa a página
          // A chamada para carregarMensagens será feita no useEffect que observa 'page'
        }
      },
      { threshold: 0.1 } // Dispara quando 10% do gatilho está visível
    );

    const loadMoreTrigger = document.querySelector('.load-more-trigger');
    // Observar o gatilho apenas se ele existir
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
      console.log('[Frontend - Chat] Observer para scroll infinito ativado.');
    } else {
       console.log('[Frontend - Chat] Gatilho de scroll (.load-more-trigger) não encontrado.');
    }

    // Cleanup do Observer
    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
        console.log('[Frontend - Chat] Observer para scroll infinito desativado.');
      }
    };
  }, [hasMore, loadingMore]); // Dependências: hasMore, loadingMore (não precisa de 'page' aqui, pois a atualização de page dispara o outro useEffect)

  // Carregar mensagens quando o número da página muda (acionado pelo Observer)
  useEffect(() => {
     if (page > 1 && contato?._id && hasMore && !loadingMore) {
        console.log(`[Frontend - Chat] Estado de página mudou para ${page}, carregando mensagens...`);
        carregarMensagens(contato._id, page); // Carregar a página que foi incrementada
     }
     // Este useEffect só precisa rodar quando 'page' muda, e opcionalmente 'contato' ou 'hasMore'/'loadingMore' se a lógica de carregarMaisMensagens for totalmente movida para cá.
     // Deixando apenas 'page' como dependência pode causar loop se carregarMensagens não atualizar hasMore/loadingMore corretamente.
     // Melhor manter 'hasMore', 'loadingMore' e 'contato' aqui para garantir que a condição seja avaliada corretamente.
  }, [page, contato?._id, hasMore, loadingMore]);


  // Scroll para última mensagem quando mensagens são atualizadas
  // Adicionado um atraso para garantir que o DOM seja atualizado
  useEffect(() => {
    // Rolar para o final apenas se a primeira página foi carregada
    if (mensagensCarregadas && !loadingMore) { // Rolar após a primeira carga ou quando terminar de carregar mais
       console.log('[Frontend - Chat] Mensagens atualizadas ou carregamento finalizado, tentando rolar...');
       const container = document.querySelector('.mensagens-container');
       if (container) {
         // Rolar para o final absoluto inicialmente ou ao carregar mais
         // Se estiver carregando uma página anterior (scroll para cima), NÃO rolar para o final
         // Uma heurística simples: se o scroll não está muito perto do topo, rolamos para o final
         // Mas para a carga inicial, queremos SEMPRE ir para o final.
         
         // Lógica: Rolar para o final quando mensagens são carregadas PELA PRIMEIRA VEZ ou quando uma NOVA mensagem chega.
         // Quando carregamos PÁGINAS ANTERIORES (scroll para cima), não rolamos para o final.

         // Vamos rolar para o final SOMENTE quando mensagensCarregadas se torna true PELA PRIMEIRA VEZ
         // OU quando o estado 'mensagens' aumenta (nova mensagem)

         // Essa lógica de scroll é complexa com paginação e mensagens em tempo real. Vamos simplificar:
         // Rolar para o final quando a *lista* de mensagens muda e não estamos carregando mais (o que indicaria scroll para cima).
         // Isso cobrirá a carga inicial e novas mensagens recebidas.
         setTimeout(() => {
             container.scrollTop = container.scrollHeight; // Rolar para o final após pequeno atraso
             console.log('[Frontend - Chat] Scroll executado.');
         }, 100);
       } else {
          console.log('[Frontend - Chat] Container de mensagens (.mensagens-container) não encontrado para scroll.');
       }
    }
  }, [mensagens, mensagensCarregadas, loadingMore]); // Depende de mensagens e do estado de carregamento

  // Atualizar tags quando mudar o contato
  useEffect(() => {
    console.log('[Frontend - Chat] Contato mudou, atualizando tags...', contato?.tags);
    setTags(contato?.tags || []);
  }, [contato]);

  // Configurar Socket.IO e listeners
  useEffect(() => {
    // Os listeners de socket agora dependem do contato selecionado para filtrar mensagens
    
    // Verificar se o socket está inicializado antes de configurar listeners
    if (!window.socket) {
      console.warn('[Frontend - Chat] Socket.IO não disponível, listeners não configurados.');
      return; 
    }

    console.log('[Frontend - Chat] Configurando listeners Socket.IO...');
    const socket = window.socket; // Usar a referência do socket global

    // Listener para novas mensagens RECEBIDAS ou a confirmação inicial de envio
    // ESTE LISTENER NÃO É MAIS USADO PARA ATUALIZAR O ESTADO DE MENSAGENS NO CHAT.JSX
    // A LÓGICA DE ATUALIZAÇÃO AGORA ESTÁ NO App.jsx PARA CENTRALIZAR O ESTADO.
    // Mantemos APENAS para log ou futuras notificações se necessário.
    const handleNovaMensagemSocket = (data) => {
      console.log('[Frontend - Chat] Socket.IO - \'nova-mensagem\' recebida (listener no Chat.jsx):', data);
      // A ação de adicionar a mensagem ao estado é feita no App.jsx.
    };

    // Listener para atualizações de status (enviado, entregue, lido)
    const handleMensagemStatusSocket = (data) => {
      console.log('[Frontend - Chat] Socket.IO - \'mensagem-status\' recebida:', data);
      // Esta lógica AINDA DEVE ser tratada aqui no Chat.jsx, pois ele gerencia a lista de mensagens exibida
      if (data.contatoId === contato?._id) { // Verificar se o status é para o contato atual
        console.log(`[Frontend - Chat] Atualizando status da mensagem ${data.id} para ${data.status}`);
        setMensagens(prev => 
          prev.map(msg => 
            // Encontrar pelo ID real (_id do banco, que vem no data.id)
            // Se a mensagem ainda for temporária, podemos tentar casar pelo conteudo e data (menos confiável)
            // Priorizar o _id real se disponível
            msg._id === data.id ? { ...msg, status: data.status, isTemporary: false } // Atualizar status e marcar como não temporária
            : msg.isTemporary && msg.conteudo === data.conteudo && new Date(msg.data).getTime() === new Date(data.data).getTime() 
              ? { ...msg, ...data, isTemporary: false } // Atualizar mensagem temporária com dados reais e status
              : msg
          )
        );
         // Atualizar mensagens com erro se o status indicar sucesso (sent, delivered, read)
        if (data.status !== 'sending' && data.status !== 'error' && data.status !== 'error_permanent') {
           setMensagensComErro(prev => {
             const newMap = new Map(prev);
             newMap.delete(data.id); // Remover da lista de erros se agora tem status de sucesso (usar data.id)
             // Se a mensagem era temporária e foi atualizada com um ID real, também tentar remover usando o ID temporário antigo, se necessário
             // Embora a lógica acima já devesse encontrar e atualizar pelo ID temporário antes de remover pelo ID real
             if (data.temporaryId) {
                 newMap.delete(data.temporaryId); // Remover pelo ID temporário se ele foi enviado com o status update
             }
             return newMap;
           });
        }
      }
    };

    // Listener para status da IA
    const handleIAStatusSocket = (data) => {
      console.log('[Frontend - Chat] Socket.IO - \'ia-status-changed\' recebida:', data);
      setIsAIActive(data.isActive);
    };

    // socket.on('nova-mensagem', handleNovaMensagemSocket); // REMOVIDO: Estado atualizado no App.jsx
    socket.on('mensagem-status', handleMensagemStatusSocket);
    socket.on('ia-status-changed', handleIAStatusSocket);

    // Cleanup do Socket.IO - Remover listeners específicos criados neste useEffect
    return () => {
      console.log('[Frontend - Chat] Limpando listeners Socket.IO...');
      // socket.off('nova-mensagem', handleNovaMensagemSocket); // REMOVIDO
      socket.off('mensagem-status', handleMensagemStatusSocket);
      socket.off('ia-status-changed', handleIAStatusSocket);
    };
    // Dependências: contato?._id (para filtrar status/mensagens) e window.socket (para garantir que o socket esteja disponível)
  }, [contato?._id, window.socket]);

  // Limpar cache periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      console.log('[Frontend - Chat] Limpando cache de mensagens antigo...');
      for (const [key, value] of mensagensCache.current.entries()) {
        if (now - value.timestamp > 300000) { // 5 minutos
          mensagensCache.current.delete(key);
        }
      }
    }, 300000); // Rodar a cada 5 minutos

    // Cleanup do Interval
    return () => clearInterval(interval);
  }, []); // Rodar apenas uma vez na montagem

  // Função para reenviar mensagem com erro
  const reenviarMensagem = async (mensagemId) => {
    const mensagem = mensagensComErro.get(mensagemId);
    if (!mensagem) {
      console.warn('[Frontend - Chat] Reenviar mensagem: Mensagem não encontrada na lista de erros:', mensagemId);
      return;
    }
    
    console.log('[Frontend - Chat] Tentando reenviar mensagem com erro:', mensagemId, '. Tentativa:', (mensagem.retryCount || 0) + 1);

    // Atualizar status localmente para 'sending' antes de tentar reenviar
     setMensagens(prev => prev.map(msg => 
       msg._id === mensagemId ? { ...msg, status: 'sending' } : msg
     ));

    try {
      // Chamar a mesma rota POST de envio
      const response = await axios.post('http://localhost:3001/api/mensagens', {
        contatoId: contato._id,
        de: 'atendente', // ou o remetente correto
        para: contato.numero,
        conteudo: mensagem.conteudo,
        tipo: mensagem.tipo || 'text',
        retryCount: (mensagem.retryCount || 0) + 1 // Incrementar contador de tentativas
      });

      console.log('[Frontend - Chat] Resposta da API /api/mensagens (reenvio):', response.data);

      // A atualização de status para 'sent', 'delivered', etc. será tratada pelo listener 'mensagem-status' do Socket.IO
      // Aqui, podemos remover da lista de erros se a chamada da API for bem sucedida (embora o status final venha pelo socket)
      setMensagensComErro(prev => {
        const newMap = new Map(prev);
        newMap.delete(mensagemId);
        console.log('[Frontend - Chat] Mensagem removida da lista de erros após tentativa de reenvio bem sucedida (API).', mensagemId);
        return newMap;
      });

       // Opcional: atualizar o _id da mensagem temporária com o real ID retornado se for o caso
       // setMensagens(prev => prev.map(msg => 
       //   msg._id === mensagemId ? { ...msg, _id: response.data._id, isTemporary: false } : msg
       // ));

    } catch (error) {
      console.error('[Frontend - Chat] Erro ao reenviar mensagem:', error);
      
      const currentRetryCount = (mensagem.retryCount || 0) + 1;

      // Se atingiu o limite de tentativas, marcar como erro permanente
      if (currentRetryCount >= MAX_RETRIES) {
        console.log(`[Frontend - Chat] Mensagem ${mensagemId} atingiu o limite máximo de ${MAX_RETRIES} tentativas. Marcando como erro permanente.`);
        setMensagens(prev => prev.map(msg => 
          msg._id === mensagemId ? { ...msg, status: 'error_permanent', retryCount: currentRetryCount } : msg
        ));
        // Manter na lista de mensagens com erro para possível inspeção, ou remover dependendo da UX desejada
        setMensagensComErro(prev => {
           const newMap = new Map(prev);
           const msgWithErrorCount = { ...mensagem, retryCount: currentRetryCount };
           newMap.set(mensagemId, msgWithErrorCount);
           return newMap;
        });

      } else {
         // Se não atingiu o limite, atualizar contador de tentativas e manter na lista de erros (para o botão de reenviar)
         console.log(`[Frontend - Chat] Tentativa ${currentRetryCount} falhou para mensagem ${mensagemId}. Tentando novamente em 3 segundos.`);
         setMensagens(prev => prev.map(msg => 
           msg._id === mensagemId ? { ...msg, status: 'error', retryCount: currentRetryCount } : msg
         ));
          setMensagensComErro(prev => {
            const newMap = new Map(prev);
            const msgWithErrorCount = { ...mensagem, retryCount: currentRetryCount };
            newMap.set(mensagemId, msgWithErrorCount);
            return newMap;
          });
        // Tentar reenviar automaticamente após um delay
        setTimeout(() => reenviarMensagem(mensagemId), 3000); // Esperar 3 segundos antes da próxima tentativa
      }

      const errorMessage = error.response?.data?.error || 'Erro ao reenviar mensagem';
      alert(`Falha ao reenviar: ${errorMessage}`);

    }
  };

  // Modificar handleSend para incluir lógica de mensagem temporária e reenviar automática
  const handleSend = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !contato || enviando) {
      console.log('[Frontend - Chat] Envio abortado: mensagem vazia, contato não selecionado ou já enviando.');
      return;
    }

    console.log('[Frontend - Chat] Iniciando processo de envio de mensagem...');
    setEnviando(true); // Desabilitar input e botão
    const mensagemConteudo = novaMensagem;
    setNovaMensagem(''); // Limpar input imediatamente

    // Criar uma mensagem temporária para exibição otimista
    const mensagemTemporariaId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`; // ID temporário único
    const novaMensagemLocal = {
        _id: mensagemTemporariaId, // Usar ID temporário
        contato: contato._id,
        de: 'atendente', // Remetente: atendente
        para: contato.numero,
        conteudo: mensagemConteudo,
        tipo: 'text',
        status: 'sending', // Status inicial: enviando
        data: new Date().toISOString(), // Usar data atual
        createdAt: new Date().toISOString(), // Usar data de criação atual
        isTemporary: true, // Marcar como temporária
        retryCount: 0 // Inicializar contador de tentativas
    };

    console.log('[Frontend - Chat] Adicionando mensagem temporária ao estado:', novaMensagemLocal);
    // Adicionar mensagem temporária ao estado para feedback imediato
    setMensagens(prev => {
       // Garantir que prev é um array antes de concatenar
       if (!Array.isArray(prev)) {
           console.warn('[Frontend - Chat] Estado de mensagens inválido ao adicionar temp (não é array), substituindo.', prev);
           return [novaMensagemLocal];
       }
       return [...prev, novaMensagemLocal];
    });

    try {
      console.log('[Frontend - Chat] Chamando API de envio de mensagem...');
      // Chamar a API do backend para enviar a mensagem via WhatsApp
      const response = await axios.post('http://localhost:3001/api/mensagens', {
        contatoId: contato._id,
        de: 'atendente', // Passar remetente correto
        para: contato.numero,
        conteudo: mensagemConteudo,
        tipo: 'text' // Passar tipo correto
      });

      console.log('[Frontend - Chat] Resposta da API /api/mensagens (envio):', response.data);

      // A resposta da API deve conter a mensagem salva no banco com o ID real.
      // Encontrar a mensagem temporária no estado e substituí-la pela mensagem real do backend.
      // A atualização de status para 'sent', 'delivered', etc. virá pelo Socket.IO ('mensagem-status').
      if (response.data && response.data._id) {
        console.log(`[Frontend - Chat] Mensagem enviada com sucesso API. Substituindo temp ID ${mensagemTemporariaId} por real ID ${response.data._id}`);
        setMensagens(prev => prev.map(msg => 
          msg._id === mensagemTemporariaId ? { ...msg, ...response.data, isTemporary: false } : msg
        ));
        // Remover da lista de erros se estava lá (não deveria estar para mensagem nova, mas segurança)
        setMensagensComErro(prev => {
           const newMap = new Map(prev);
           newMap.delete(mensagemTemporariaId);
           return newMap;
        });

      } else {
         console.error('[Frontend - Chat] Resposta da API de envio não retornou o _id da mensagem:', response.data);
         // Tratar como um erro de envio se o _id não for retornado
         throw new Error('Resposta da API de envio inválida');
      }

    } catch (error) {
      console.error('[Frontend - Chat] Erro ao enviar mensagem (catch):', error);
      
      const errorMessage = error.response?.data?.error || 'Erro ao enviar mensagem';
      
      // Marcar a mensagem temporária como erro e adicioná-la à lista de mensagens com erro
      setMensagens(prev => prev.map(msg => 
        msg._id === mensagemTemporariaId ? { ...msg, status: 'error', retryCount: 0 } : msg
      ));
      setMensagensComErro(prev => {
        const newMap = new Map(prev);
        // Usar os dados da mensagem local temporária para adicionar à lista de erros
        newMap.set(mensagemTemporariaId, { ...novaMensagemLocal, status: 'error', retryCount: 0 });
        return newMap;
      });

      // Tentar reenviar automaticamente a primeira vez
      if (novaMensagemLocal.retryCount < MAX_RETRIES) { // Inicia com 0, tenta 1 vez aqui + MAX_RETRIES no reenviar
         console.log('[Frontend - Chat] Tentando reenvio automático inicial em 3 segundos...');
         setTimeout(() => reenviarMensagem(mensagemTemporariaId), 3000); // Esperar 3 segundos
      }

      alert(errorMessage);

    } finally {
      // setEnviando(false); // Não desabilitar aqui, será reabilitado após o reenvio ou erro permanente/sucesso via socket
      console.log('[Frontend - Chat] Processo de envio (handleSend) finalizado. Aguardando Socket.IO ou reenvio.');
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
      <div className="flex-1 flex flex-col overflow-y-auto p-4">
        {hasMore && (
          <div className="load-more-trigger h-4 w-full" />
        )}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primaryLight"></div>
          </div>
        )}
        {mensagens.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`mb-4 flex ${msg.de === contato?.numero ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.de === contato?.numero
                  ? 'bg-accent text-primary'
                  : 'bg-primaryLight text-white'
              }`}
            >
              <div className="text-sm break-words">{msg.conteudo}</div>
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.data).toLocaleTimeString()}
                {msg.status && (
                  <span className="ml-2">
                    {msg.status === 'sent' && '✓'}
                    {msg.status === 'delivered' && '✓✓'}
                    {msg.status === 'read' && '✓✓'}
                    {msg.status === 'error' && '⚠️'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
        {/* Botão para editar tags */}
        {contato && (
          <div className="ml-2 relative">
            <button
              className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-primaryLight"
              title="Editar tags"
              onClick={() => setEditandoTags(v => !v)}
            >
              <FaTags />
            </button>
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
      <div className="flex-1 overflow-y-auto p-6 bg-accent mensagens-container">
        {mensagensCarregadas && renderMensagens()}
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