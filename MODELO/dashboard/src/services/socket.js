import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.socket.on('connect', () => {
                console.log('[Dashboard] Conectado ao servidor WebSocket');
            });

            this.socket.on('disconnect', () => {
                console.log('[Dashboard] Desconectado do servidor WebSocket');
            });

            this.setupDefaultListeners();
        }
        return this.socket;
    }

    setupDefaultListeners() {
        // Listener para novas mensagens
        this.socket.on('nova-mensagem', (data) => {
            this.notifyListeners('nova-mensagem', data);
        });

        // Listener para atualizações de status
        this.socket.on('mensagem-status', (data) => {
            this.notifyListeners('mensagem-status', data);
        });

        // Listener para atualizações de estatísticas
        this.socket.on('atualizar-estatisticas', (data) => {
            this.notifyListeners('atualizar-estatisticas', data);
        });

        // Listener para atualizações de contatos
        this.socket.on('atualizar-contatos', (data) => {
            this.notifyListeners('atualizar-contatos', data);
        });
    }

    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    removeListener(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
export default socketService; 