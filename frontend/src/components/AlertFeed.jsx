import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

const AlertFeed = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    socket.on('nova-mensagem', ({ contatoId, mensagem }) => {
      // Verifica se é um alerta (tem tipo 'aviso' ou 'alerta')
      if (mensagem.tipo === 'aviso' || mensagem.tipo === 'alerta') {
        const alert = {
          id: Date.now(),
          cliente: mensagem.cliente || 'Cliente não identificado',
          vendedor: mensagem.atendente || 'Atendente não identificado',
          tipo: mensagem.tipo,
          conteudo: mensagem.motivo || mensagem.acao_sugerida || 'Sem detalhes',
          data: new Date()
        };
        setAlerts(prev => [alert, ...prev.slice(0, 19)]); // Limita a 20 alertas
      }
    });

    return () => {
      socket.off('nova-mensagem');
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#FFD60033] to-[#232946] p-6 rounded-xl shadow-lg flex flex-col gap-2 max-h-[320px] overflow-y-auto border border-yellow-900">
      <h2 className="text-xl font-bold text-yellow-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="alerta">⚡</span> Alertas em Tempo Real
      </h2>
      {alerts.length > 0 ? (
        <ul className="space-y-2">
          {alerts.map(alert => (
            <li key={alert.id} className="p-3 rounded-lg shadow bg-[#232946] flex flex-col border border-yellow-900">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block w-2 h-2 rounded-full ${alert.tipo === 'aviso' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                <span className="font-semibold text-yellow-100">{alert.cliente}</span>
                {alert.vendedor && <span className="ml-2 text-xs text-blue-300">Vendedor: {alert.vendedor}</span>}
                <span className="ml-auto text-xs text-gray-400">{alert.data.toLocaleTimeString()}</span>
              </div>
              <div className="text-sm text-yellow-100">{alert.conteudo}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-yellow-100">Nenhum alerta no momento.</p>
      )}
    </div>
  );
};

export default AlertFeed; 