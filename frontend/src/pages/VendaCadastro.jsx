import React, { useState } from 'react';
import { ATENDENTES } from '../constants/atendentes';

export default function VendaCadastro() {
  const [vendedor, setVendedor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setErrorMessage('');

    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          vendedor, 
          quantidade: Number(quantidade), 
          valor: Number(valor),
          data: new Date()
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || 'Erro ao cadastrar venda');
      }

      await res.json();
      setStatus('success');
      setVendedor(''); 
      setQuantidade(''); 
      setValor('');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Erro ao cadastrar venda');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#10121A] via-[#181C2A] to-[#0A0C13] p-6">
      <form onSubmit={handleSubmit} className="bg-[#181C2A]/95 border-2 border-[#A8324A] rounded-2xl shadow-2xl p-10 flex flex-col gap-6 w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-[#A8324A] mb-2 text-center">Cadastro de Venda</h1>
        
        <label className="text-[#A8324A] font-bold">Vendedor
          <select 
            className="mt-1 w-full rounded bg-[#232946] text-white p-2 border border-[#A8324A] focus:outline-none focus:ring-2 focus:ring-[#A8324A]"
            value={vendedor}
            onChange={e => setVendedor(e.target.value)}
            required
          >
            <option value="">Selecione um vendedor</option>
            {ATENDENTES.map(atendente => (
              <option key={atendente} value={atendente}>{atendente}</option>
            ))}
          </select>
        </label>

        <label className="text-[#A8324A] font-bold">Quantidade de Linhas
          <input 
            type="number" 
            min="1" 
            className="mt-1 w-full rounded bg-[#232946] text-white p-2 border border-[#A8324A] focus:outline-none focus:ring-2 focus:ring-[#A8324A]" 
            value={quantidade} 
            onChange={e => setQuantidade(e.target.value)} 
            required 
          />
        </label>

        <label className="text-[#A8324A] font-bold">Valor Total da Venda (R$)
          <input 
            type="number" 
            min="0" 
            step="0.01" 
            className="mt-1 w-full rounded bg-[#232946] text-white p-2 border border-[#A8324A] focus:outline-none focus:ring-2 focus:ring-[#A8324A]" 
            value={valor} 
            onChange={e => setValor(e.target.value)} 
            required 
          />
        </label>

        <button 
          type="submit" 
          className="bg-[#A8324A] hover:bg-[#B22234] text-white font-bold py-2 rounded-lg transition"
        >
          Cadastrar Venda
        </button>

        {status === 'success' && (
          <div className="text-green-400 text-center font-bold">
            Venda cadastrada com sucesso!
          </div>
        )}
        {status === 'error' && (
          <div className="text-red-400 text-center font-bold">
            {errorMessage || 'Erro ao cadastrar venda.'}
          </div>
        )}
      </form>
    </div>
  );
} 