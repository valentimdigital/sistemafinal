import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { io } from 'socket.io-client';
import { dddInfo } from '../utils/dddInfo';
import { extrairDDD } from '../utils/extrairDDD';

// REGISTRO DOS COMPONENTES DO CHART.JS
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5
});

const SalesChart = () => {
  const [estatisticas, setEstatisticas] = useState({ totalAtendimentos: 0, topCidades: [] });

  useEffect(() => {
    // Buscar estatísticas do backend
    fetch('http://localhost:3001/api/contatos')
      .then(res => res.json())
      .then(contatos => {
        // Agrupar por DDD usando a função extrairDDD
        const dddMap = {};
        contatos.forEach(c => {
          const ddd = extrairDDD(c.numero);
          if (!dddMap[ddd]) dddMap[ddd] = 0;
          dddMap[ddd]++;
        });
        const topCidades = Object.entries(dddMap)
          .map(([ddd, total]) => {
            const info = dddInfo[ddd];
            return {
              sigla: info ? info.sigla : `DDD ${ddd}`,
              descricao: info ? info.descricao : `DDD ${ddd}`,
              ddd,
              total
            };
          })
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);
        setEstatisticas({ totalAtendimentos: contatos.length, topCidades });
      });
    // Se quiser atualizar em tempo real, pode ouvir eventos do socket aqui
  }, []);

  // Preparar dados para o gráfico de barras
  const barData = {
    labels: estatisticas.topCidades.map(c => c.sigla),
    datasets: [
      {
        label: 'Atendimentos',
        data: estatisticas.topCidades.map(c => c.total),
        backgroundColor: 'rgba(34, 211, 238, 0.7)', // ciano
        borderColor: 'rgba(34, 211, 238, 1)',
        borderWidth: 2,
        borderRadius: 8,
        maxBarThickness: 40
      }
    ]
  };

  return (
    <div className="bg-gradient-to-r from-[#0891B2] to-[#232946] p-6 rounded-xl shadow-lg flex flex-col gap-2 border border-cyan-900">
      <h2 className="text-xl font-bold text-cyan-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="chart">📈</span> Gráfico de Vendas por Cidade
      </h2>
      <div className="mb-2 text-cyan-100 text-sm">
        <div className="mb-1 font-semibold">Atendimentos feitos: <span className="text-cyan-300">{estatisticas.totalAtendimentos}</span></div>
      </div>
      <div className="bg-[#181C2A] rounded-lg p-4 shadow min-h-[180px] flex items-center justify-center">
        {estatisticas.topCidades && estatisticas.topCidades.length > 0 ? (
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                  callbacks: {
                    title: (context) => {
                      const idx = context[0].dataIndex;
                      return estatisticas.topCidades[idx].descricao;
                    },
                    label: (context) => `Atendimentos: ${context.parsed.y}`
                  }
                }
              },
              scales: {
                x: {
                  grid: { color: '#232946' },
                  ticks: { color: '#C9D1D9', font: { weight: 'bold' } }
                },
                y: {
                  grid: { color: '#232946' },
                  ticks: { color: '#C9D1D9', stepSize: 1, precision: 0 }
                }
              }
            }}
          />
        ) : (
          <span className="text-cyan-300">Nenhum dado para exibir gráfico.</span>
        )}
      </div>
    </div>
  );
};

export default SalesChart; 