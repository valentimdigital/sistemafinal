import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

const ATENDENTES = [
  'Wellington Ribeiro',
  'Ana Cunha',
  'Thayná Freitas',
  'Livia Martins',
  'Valentim',
  'Valentina (IA)'
];

const HeatmapVendedores = () => {
  const [dadosVendedores, setDadosVendedores] = useState([]);

  useEffect(() => {
    // Buscar dados iniciais
    fetch('http://localhost:3001/api/contatos')
      .then(res => res.json())
      .then(contatos => {
        const dados = ATENDENTES.map(atendente => {
          const contatosAtendente = contatos.filter(c => c.atendente === atendente);
          const totalContatos = contatosAtendente.length;
          const contatosConcluidos = contatosAtendente.filter(c => c.status === 'concluida').length;
          const contatosEmRisco = contatosAtendente.filter(c => c.status === 'risco').length;
          const taxaConversao = totalContatos > 0 ? (contatosConcluidos / totalContatos) * 100 : 0;
          
          return {
            atendente,
            totalContatos,
            contatosConcluidos,
            contatosEmRisco,
            taxaConversao
          };
        });

        setDadosVendedores(dados);
      });

    // Atualização em tempo real
    socket.on('atualizar-contatos', () => {
      fetch('http://localhost:3001/api/contatos')
        .then(res => res.json())
        .then(contatos => {
          const dados = ATENDENTES.map(atendente => {
            const contatosAtendente = contatos.filter(c => c.atendente === atendente);
            const totalContatos = contatosAtendente.length;
            const contatosConcluidos = contatosAtendente.filter(c => c.status === 'concluida').length;
            const contatosEmRisco = contatosAtendente.filter(c => c.status === 'risco').length;
            const taxaConversao = totalContatos > 0 ? (contatosConcluidos / totalContatos) * 100 : 0;
            
            return {
              atendente,
              totalContatos,
              contatosConcluidos,
              contatosEmRisco,
              taxaConversao
            };
          });

          setDadosVendedores(dados);
        });
    });

    return () => {
      socket.off('atualizar-contatos');
    };
  }, []);

  const getCorIntensidade = (taxaConversao) => {
    if (taxaConversao >= 80) return 'bg-green-500';
    if (taxaConversao >= 60) return 'bg-green-400';
    if (taxaConversao >= 40) return 'bg-yellow-400';
    if (taxaConversao >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-gradient-to-r from-[#232946] to-[#181C2A] p-4 rounded-xl shadow-lg flex flex-col gap-2 border border-[#232946]">
      <h2 className="text-lg font-bold text-blue-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="heatmap">🔥</span> Heatmap de Vendedores
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {dadosVendedores
          .sort((a, b) => b.taxaConversao - a.taxaConversao)
          .map(item => (
          <div 
            key={item.atendente} 
            className="bg-[#232946] bg-opacity-80 rounded-lg p-3 shadow border border-[#313244] hover:border-blue-500 transition-colors duration-200"
            title={`${item.atendente}
Total: ${item.totalContatos}
Concluídos: ${item.contatosConcluidos}
Em risco: ${item.contatosEmRisco}
Taxa de conversão: ${item.taxaConversao.toFixed(1)}%`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-pink-100">{item.atendente}</span>
              <span className="text-sm font-bold text-blue-200 bg-blue-900/30 px-2 py-1 rounded">
                {item.taxaConversao.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-grow h-2 bg-[#313244] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getCorIntensidade(item.taxaConversao)} transition-all duration-500`}
                  style={{ width: `${item.taxaConversao}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-green-300 font-medium">{item.contatosConcluidos} concluídos</span>
              <span className="text-red-300 font-medium">{item.contatosEmRisco} em risco</span>
              <span className="text-blue-300 font-medium">{item.totalContatos} total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapVendedores; 