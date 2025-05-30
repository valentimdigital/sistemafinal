import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AtendimentosPorDiaChart = () => {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/contatos')
      .then(res => res.json())
      .then(contatos => {
        // Agrupar por dia
        const porDia = {};
        contatos.forEach(c => {
          let data = c.createdAt || c.created_at;
          if (!data) return;
          // Remove DDI do número se existir
          if (c.numero && c.numero.startsWith('55') && c.numero.length > 11) {
            c.numero = c.numero.slice(2);
          }
          const dia = new Date(data).toLocaleDateString('pt-BR');
          porDia[dia] = (porDia[dia] || 0) + 1;
        });
        // Ordenar por data
        const resultado = Object.entries(porDia)
          .map(([data, total]) => ({ data, total }))
          .sort((a, b) => new Date(a.data.split('/').reverse().join('-')) - new Date(b.data.split('/').reverse().join('-')));
        setDados(resultado);
      });
  }, []);

  const chartData = {
    labels: dados.map(d => d.data),
    datasets: [
      {
        label: 'Atendimentos por dia',
        data: dados.map(d => d.total),
        borderColor: 'rgba(34, 211, 238, 1)',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(34, 211, 238, 1)'
      }
    ]
  };

  return (
    <div className="bg-gradient-to-r from-[#232946] to-[#181C2A] p-6 rounded-xl shadow-lg flex flex-col gap-2 border border-cyan-900">
      <h2 className="text-lg font-bold text-cyan-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="linechart">📊</span> Evolução Diária de Atendimentos
      </h2>
      <div className="bg-[#181C2A] rounded-lg p-4 shadow min-h-[180px] flex items-center justify-center">
        {dados.length > 0 ? (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false }
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

export default AtendimentosPorDiaChart; 