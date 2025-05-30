import React from 'react';
import AlertFeed from '../components/AlertFeed';
import SalesChart from '../components/SalesChart';
import PerformanceCard from '../components/PerformanceCard';
import HeatmapVendedores from '../components/HeatmapVendedores';
import AtendimentosPorDiaChart from '../components/AtendimentosPorDiaChart';
import AtendimentosDetalhados from '../components/AtendimentosDetalhados';

const Topbar = () => (
  <header className="w-full bg-[#181C2A] shadow flex items-center px-6 py-3 mb-4">
    <img src="/favicon.ico" alt="Logo" className="w-8 h-8 mr-3" />
    <h1 className="text-2xl font-bold text-blue-100 tracking-tight">Painel Inteligente Valentim Digital</h1>
    <span className="ml-auto text-sm text-gray-400 font-semibold">by Valentina IA</span>
  </header>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181C2A] via-[#232946] to-[#181C2A] flex flex-col">
      <Topbar />
      <main className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PerformanceCard />
          <AlertFeed />
          <SalesChart />
          <AtendimentosPorDiaChart />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <HeatmapVendedores />
          <AtendimentosDetalhados />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 