import React, { useEffect, useState } from 'react';

export default function VendasLista() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState([]);
  const [totais, setTotais] = useState({ totalVendas: 0, valorTotal: 0 });

  useEffect(() => {
    fetch('/api/vendas')
      .then(res => res.json())
      .then(data => {
        setVendas(data);
        
        // Calcular totais
        const totalVendas = data.reduce((acc, v) => acc + v.quantidade, 0);
        const valorTotal = data.reduce((acc, v) => acc + v.valor, 0);
        setTotais({ totalVendas, valorTotal });

        // Calcular ranking
        const vendasPorVendedor = data.reduce((acc, v) => {
          if (!acc[v.vendedor]) {
            acc[v.vendedor] = { vendas: 0, valor: 0 };
          }
          acc[v.vendedor].vendas += v.quantidade;
          acc[v.vendedor].valor += v.valor;
          return acc;
        }, {});

        const rankingArray = Object.entries(vendasPorVendedor)
          .map(([vendedor, dados]) => ({
            vendedor,
            vendas: dados.vendas,
            valor: dados.valor
          }))
          .sort((a, b) => b.vendas - a.vendas);

        setRanking(rankingArray);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#10121A] via-[#181C2A] to-[#0A0C13] p-6">
      <div className="bg-[#181C2A]/95 border-2 border-[#A8324A] rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
        <h1 className="text-2xl font-extrabold text-[#A8324A] mb-6 text-center">Vendas Cadastradas</h1>
        
        {/* Totais */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#232946] p-4 rounded-lg text-center">
            <h3 className="text-[#A8324A] font-bold mb-2">Total de Vendas</h3>
            <p className="text-white text-2xl">{totais.totalVendas}</p>
          </div>
          <div className="bg-[#232946] p-4 rounded-lg text-center">
            <h3 className="text-[#A8324A] font-bold mb-2">Valor Total</h3>
            <p className="text-white text-2xl">
              {totais.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        {/* Ranking */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#A8324A] mb-4">Ranking dos Vendedores</h2>
          <div className="grid grid-cols-3 gap-4">
            {ranking.slice(0, 3).map((vendedor, index) => (
              <div key={vendedor.vendedor} className="bg-[#232946] p-4 rounded-lg">
                <div className="text-[#A8324A] font-bold mb-2">{index + 1}º {vendedor.vendedor}</div>
                <div className="text-white">
                  <p>{vendedor.vendas} vendas</p>
                  <p className="text-sm text-gray-400">
                    {vendedor.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Vendas */}
        {loading ? (
          <div className="text-white text-center">Carregando...</div>
        ) : vendas.length === 0 ? (
          <div className="text-white text-center">Nenhuma venda cadastrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-white">
              <thead>
                <tr className="bg-[#232946]">
                  <th className="px-4 py-2 text-left text-[#A8324A]">Vendedor</th>
                  <th className="px-4 py-2 text-left text-[#A8324A]">Quantidade</th>
                  <th className="px-4 py-2 text-left text-[#A8324A]">Valor Total (R$)</th>
                  <th className="px-4 py-2 text-left text-[#A8324A]">Data</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda._id} className="border-b border-[#A8324A]/30 hover:bg-[#232946]/60">
                    <td className="px-4 py-2 font-bold">{venda.vendedor}</td>
                    <td className="px-4 py-2">{venda.quantidade}</td>
                    <td className="px-4 py-2">{venda.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="px-4 py-2">{new Date(venda.data).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 