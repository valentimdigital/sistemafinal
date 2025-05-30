import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export default function useSocket() {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [conversas, setConversas] = useState([]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            autoConnect: true,
            withCredentials: true
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket.IO conectado');
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket.IO desconectado');
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Erro na conexão Socket.IO:', error);
            setConnectionStatus('error');
        });

        newSocket.on('qr-code', ({ qr }) => {
            console.log('🔄 QR Code recebido');
            setQrCode(qr);
        });

        newSocket.on('connection-status', ({ status }) => {
            console.log('📡 Status da conexão:', status);
            setConnectionStatus(status);
        });

        newSocket.on('nova-mensagem', (mensagem) => {
            setConversas(prev => {
                const conversaExistente = prev.find(c => c.id === mensagem.conversaId);
                if (conversaExistente) {
                    return prev.map(c => 
                        c.id === mensagem.conversaId 
                            ? { ...c, mensagens: [...c.mensagens, mensagem] }
                            : c
                    );
                }
                return [...prev, { id: mensagem.conversaId, mensagens: [mensagem] }];
            });
        });

        newSocket.on('mensagem-status', (status) => {
            setConversas(prev => 
                prev.map(conversa => ({
                    ...conversa,
                    mensagens: conversa.mensagens.map(msg =>
                        msg.id === status.mensagemId
                            ? { ...msg, status: status.status }
                            : msg
                    )
                }))
            );
        });

        setSocket(newSocket);
        window.socket = newSocket; // Disponibilizar globalmente para outros componentes

        return () => {
            console.log('🔄 Limpando conexão Socket.IO');
            newSocket.close();
        };
    }, []);

    const enviarMensagem = async (jid, mensagem) => {
        if (!socket) return false;
        socket.emit('enviar-mensagem', { jid, mensagem });
        return true;
    };

    const atualizarStatus = () => {
        if (!socket) return;
        socket.emit('verificar-conexao');
    };

    return {
        socket,
        isConnected,
        qrCode,
        connectionStatus,
        conversas,
        enviarMensagem,
        atualizarStatus
    };
} 