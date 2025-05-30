import React, { useEffect, useState } from 'react';
import socketService from '../services/socket';

const PerformanceCard = () => {
  const [indicadores, setIndicadores] = useState({
    vendasEmAndamento: 0,
    vendasConcluidas: 0,
    conversasEmRisco: 0,
    respostasAtrasadas: 0,
    atendimentosIA: 0,
    vendedoresAtivos: 0
  });

  useEffect(() => {
    // Buscar dados reais do backend
    fetch('http://localhost:3001/api/contatos')
      .then(res => res.json())
      .then(data => {
        setIndicadores(prev => ({
          ...prev,
          vendedoresAtivos: data.length,
          vendasEmAndamento: data.filter(c => c.status === 'andamento').length,
          vendasConcluidas: data.filter(c => c.status === 'concluida').length,
          conversasEmRisco: data.filter(c => c.status === 'risco').length,
          atendimentosIA: data.filter(c => c.iaAtiva).length
        }));
      });

    // Atualização em tempo real usando o serviço centralizado
    socketService.addListener('atualizar-contatos', (data) => {
      fetch('http://localhost:3001/api/contatos')
        .then(res => res.json())
        .then(data => {
          setIndicadores(prev => ({
            ...prev,
            vendedoresAtivos: data.length,
            vendasEmAndamento: data.filter(c => c.status === 'andamento').length,
            vendasConcluidas: data.filter(c => c.status === 'concluida').length,
            conversasEmRisco: data.filter(c => c.status === 'risco').length,
            atendimentosIA: data.filter(c => c.iaAtiva).length
          }));
        });
    });

    return () => {
      socketService.removeListener('atualizar-contatos');
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Performance</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="text-sm text-blue-600">Vendas em Andamento</h3>
          <p className="text-2xl font-bold text-blue-700">{indicadores.vendasEmAndamento}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h3 className="text-sm text-green-600">Vendas Concluídas</h3>
          <p className="text-2xl font-bold text-green-700">{indicadores.vendasConcluidas}</p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <h3 className="text-sm text-red-600">Conversas em Risco</h3>
          <p className="text-2xl font-bold text-red-700">{indicadores.conversasEmRisco}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="text-sm text-yellow-600">Atendimentos IA</h3>
          <p className="text-2xl font-bold text-yellow-700">{indicadores.atendimentosIA}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard; 