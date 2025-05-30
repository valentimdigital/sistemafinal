import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCache } from '../hooks/useCache';

const FRASES = [
  'O sucesso é a soma de pequenos esforços repetidos todos os dias.',
  'Acredite no seu potencial e vá além!',
  'Cada atendimento é uma oportunidade de encantar.',
  'Grandes conquistas começam com pequenas atitudes.',
  'Você faz a diferença no resultado do time!',
  'Seja a energia positiva que o cliente precisa hoje.'
];

const METAS = [
  'Atenda pelo menos 10 clientes hoje!',
  'Feche 3 vendas até o final do dia.',
  'Marque follow-up para todos os clientes em negociação.',
  'Use tags para organizar seus atendimentos.'
];

const DICAS = [
  'Use tags para identificar clientes com pendências.',
  'Marque favoritos para não perder clientes importantes.',
  'Acompanhe o ranking e desafie-se a subir posições!',
  'Aproveite o modo escuro para trabalhar com mais conforto.'
];

function fraseAleatoria() {
  return FRASES[Math.floor(Math.random() * FRASES.length)];
}

function dicaAleatoria() {
  return DICAS[Math.floor(Math.random() * DICAS.length)];
}

export default function HomeMotivacional() {
  const [frase, setFrase] = useState(fraseAleatoria());
  const [dica, setDica] = useState(dicaAleatoria());
  const navigate = useNavigate();

  // Usar o hook de cache para o ranking
  const { data: ranking, loading } = useCache(
    'ranking_vendas',
    async () => {
      const response = await fetch('/api/vendas/ranking');
      return response.json();
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutos
      refreshInterval: 5 * 60 * 1000 // Atualiza a cada 5 minutos
    }
  );

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#10121A] via-[#181C2A] to-[#0A0C13] p-0">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch justify-center gap-10 p-8">
        {/* Card principal */}
        <div className="flex-1 bg-[#181C2A]/95 backdrop-blur-md rounded-2xl shadow-2xl p-10 flex flex-col gap-8 border-2 border-[#A8324A] min-w-[340px]">
          <h1 className="text-4xl font-extrabold mb-1 text-[#A8324A] drop-shadow text-center">Bem-vindo, imparável!</h1>
          <h2 className="text-2xl font-bold mb-4 text-[#B22234] drop-shadow text-center">Esse é o seu Painel de Vendas</h2>
          <blockquote className="text-xl text-white/90 italic text-center border-l-4 border-[#A8324A] pl-4">{frase}</blockquote>
          <button onClick={() => setFrase(fraseAleatoria())} className="text-xs text-[#A8324A] hover:underline self-center">Nova frase motivacional</button>
          <div>
            <h2 className="text-lg font-bold text-[#A8324A] mb-2">Metas do Dia</h2>
            <ul className="list-disc pl-6 text-white/90 space-y-1">
              {METAS.map((meta, i) => <li key={i}>{meta}</li>)}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#A8324A] mb-2">Dica Rápida</h2>
            <div className="text-white/90 text-center">{dica}</div>
            <button onClick={() => setDica(dicaAleatoria())} className="text-xs text-[#A8324A] hover:underline mt-1 self-center">Nova dica</button>
          </div>
        </div>
        {/* Ranking e botões */}
        <div className="flex flex-col gap-8 items-center justify-between min-w-[320px] w-full md:w-[340px]">
          <div className="bg-[#181C2A]/95 rounded-2xl shadow-2xl border-2 border-[#A8324A] p-8 w-full flex flex-col gap-6">
            <h2 className="text-xl font-bold text-[#A8324A] mb-4 text-center">Ranking dos Vendedores</h2>
            {loading ? (
              <div className="text-white/90 text-center">Carregando ranking...</div>
            ) : !ranking || ranking.length === 0 ? (
              <div className="text-white/90 text-center">Nenhuma venda registrada ainda.</div>
            ) : (
              <ol className="text-white/90 space-y-4">
                {ranking.map((v, i) => {
                  const primeiroNome = v.nome.split(' ')[0];
                  return (
                    <li key={v.nome} className={`flex items-center justify-between gap-2 rounded-lg p-3 ${i === 0 ? 'bg-yellow-900/20 border-2 border-yellow-400' : i === 1 ? 'bg-gray-700/20 border-2 border-gray-300' : i === 2 ? 'bg-orange-900/20 border-2 border-orange-400' : 'bg-[#232946]/60 border border-[#232946]'}`}>
                      <span className="flex items-center gap-2 font-bold text-lg">
                        {i === 0 && <span title="1º Lugar" className="text-yellow-300 text-2xl">🏆</span>}
                        {i === 1 && <span title="2º Lugar" className="text-gray-200 text-2xl">🥈</span>}
                        {i === 2 && <span title="3º Lugar" className="text-orange-400 text-2xl">🥉</span>}
                        <span className={i === 0 ? 'text-yellow-300' : i === 1 ? 'text-gray-200' : i === 2 ? 'text-orange-400' : ''}>{i + 1}º {primeiroNome}</span>
                      </span>
                      <span className="text-[#A8324A] font-bold">{v.vendas} vendas</span>
                      <span className="text-sm text-white/80">{v.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <div className="flex flex-col gap-4 w-full">
            <button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">WhatsApp Chat</button>
            <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Dashboard</button>
            <button onClick={() => navigate('/venda')} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">Venda</button>
            <button onClick={() => navigate('/discadora/atendimento')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">Discadora Atendimento</button>
            <button onClick={() => navigate('/vendas')} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded">Vendas</button>
          </div>
        </div>
      </div>
    </div>
  );
} 