import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

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
    // Atualização em tempo real
    socket.on('atualizar-contatos', () => {
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
      socket.off('atualizar-contatos');
    };
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#232946] to-[#181C2A] p-4 rounded-xl shadow-lg flex flex-col gap-2 border border-[#232946]">
      <h2 className="text-lg font-bold text-blue-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="performance">📊</span> Indicadores de Desempenho
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#313244]">
          <span className="text-xl font-bold text-blue-400">{indicadores.vendasEmAndamento}</span>
          <span className="text-xs text-blue-300">Vendas em Andamento</span>
        </div>
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#234F1E]">
          <span className="text-xl font-bold text-green-400">{indicadores.vendasConcluidas}</span>
          <span className="text-xs text-green-300">Vendas Concluídas</span>
        </div>
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#3B2F2F]">
          <span className="text-xl font-bold text-red-400">{indicadores.conversasEmRisco}</span>
          <span className="text-xs text-red-300">Conversas em Risco</span>
        </div>
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#FFD600]">
          <span className="text-xl font-bold text-yellow-300">{indicadores.respostasAtrasadas}</span>
          <span className="text-xs text-yellow-200">Respostas Atrasadas</span>
        </div>
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#3A2E5C]">
          <span className="text-xl font-bold text-purple-300">{indicadores.atendimentosIA}</span>
          <span className="text-xs text-purple-200">Atendimentos IA</span>
        </div>
        <div className="bg-[#232946] bg-opacity-80 rounded-lg p-2 shadow flex flex-col items-center border border-[#0891B2]">
          <span className="text-xl font-bold text-cyan-300">{indicadores.vendedoresAtivos}</span>
          <span className="text-xs text-cyan-200">Vendedores Ativos</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCard; 