import React, { useEffect, useState } from 'react';

const AlertFeed = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Aqui você pode adicionar a lógica para buscar alertas do backend
    // Por enquanto, vamos deixar o array vazio
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#232946] to-[#181C2A] p-6 rounded-xl shadow-lg flex flex-col gap-2 border border-yellow-900">
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