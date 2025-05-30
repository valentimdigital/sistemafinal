import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AlertFeed from '../components/AlertFeed';
import SalesChart from '../components/SalesChart';
import PerformanceCard from '../components/PerformanceCard';
import HeatmapVendedores from '../components/HeatmapVendedores';
import AtendimentosPorDiaChart from '../components/AtendimentosPorDiaChart';
import AtendimentosDetalhados from '../components/AtendimentosDetalhados';
import { getEstatisticas, getSentimentos } from '../services/api';
import socketService from '../services/socket';

const Topbar = () => (
  <header className="w-full bg-[#181C2A] shadow flex items-center px-6 py-3 mb-4">
    <img src="/favicon.ico" alt="Logo" className="w-8 h-8 mr-3" />
    <h1 className="text-2xl font-bold text-blue-100 tracking-tight">Painel Inteligente Valentim Digital</h1>
    <span className="ml-auto text-sm text-gray-400 font-semibold">by Valentina IA</span>
  </header>
);

const Dashboard = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [sentimentos, setSentimentos] = useState(null);

  // Queries para buscar dados iniciais
  const { data: estatisticasData } = useQuery(['estatisticas'], getEstatisticas, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    onSuccess: (data) => setEstatisticas(data)
  });

  const { data: sentimentosData } = useQuery(['sentimentos'], getSentimentos, {
    refetchInterval: 30000,
    onSuccess: (data) => setSentimentos(data)
  });

  useEffect(() => {
    // Conectar ao WebSocket
    const socket = socketService.connect();

    // Configurar listeners para atualizações em tempo real
    socketService.addListener('atualizar-estatisticas', (data) => {
      setEstatisticas(prev => ({
        ...prev,
        ...data
      }));
    });

    socketService.addListener('nova-mensagem', (data) => {
      // Atualizar estatísticas quando uma nova mensagem chegar
      if (estatisticas) {
        setEstatisticas(prev => ({
          ...prev,
          totalMensagens: prev.totalMensagens + 1,
          mensagensPorStatus: {
            ...prev.mensagensPorStatus,
            [data.tipo]: (prev.mensagensPorStatus[data.tipo] || 0) + 1
          }
        }));
      }
    });

    return () => {
      // Limpar listeners ao desmontar
      socketService.removeListener('atualizar-estatisticas');
      socketService.removeListener('nova-mensagem');
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181C2A] via-[#232946] to-[#181C2A] flex flex-col">
      <Topbar />
      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PerformanceCard estatisticas={estatisticas} />
          <AlertFeed sentimentos={sentimentos} />
          <SalesChart estatisticas={estatisticas} />
          <AtendimentosPorDiaChart estatisticas={estatisticas} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <HeatmapVendedores estatisticas={estatisticas} />
          <AtendimentosDetalhados estatisticas={estatisticas} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 