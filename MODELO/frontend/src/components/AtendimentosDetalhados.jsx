import React, { useEffect, useState } from 'react';

const dddSigla = {
  '11': 'SP', '21': 'RJ', '31': 'MG', '41': 'PR', '51': 'RS', '61': 'DF', '71': 'BA', '81': 'PE',
  '85': 'CE', '91': 'PA', '92': 'AM', '98': 'MA', '99': 'MA', '27': 'ES', '19': 'SP', '16': 'SP',
  '34': 'MG', '95': 'RR', '82': 'AL', '84': 'RN', '86': 'PI', '96': 'AP', '63': 'TO', '68': 'AC',
  '69': 'RO', '65': 'MT', '67': 'MS', '73': 'BA', '75': 'BA', '77': 'BA', '79': 'SE', '83': 'PB',
  '93': 'PA', '94': 'PA', '47': 'SC', '46': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '35': 'MG',
  '37': 'MG', '38': 'MG'
};

const AtendimentosDetalhados = () => {
  const [atendimentos, setAtendimentos] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const contatos = await fetch('http://localhost:3001/api/contatos').then(res => res.json());
      // Buscar últimas mensagens de cada contato
      const mensagensPromises = contatos.map(async (c) => {
        const msgs = await fetch(`http://localhost:3001/api/mensagens/${c._id}`).then(res => res.json());
        // Última mensagem recebida do cliente
        const ultimaMsgCliente = msgs.reverse().find(m => m.de !== 'me');
        // Última mensagem enviada pelo sistema/vendedor
        const ultimaMsgVendedor = msgs.reverse().find(m => m.de === 'me');
        let aguardandoMin = null;
        if (ultimaMsgCliente && (!ultimaMsgVendedor || new Date(ultimaMsgCliente.createdAt) > new Date(ultimaMsgVendedor.createdAt))) {
          aguardandoMin = Math.floor((Date.now() - new Date(ultimaMsgCliente.createdAt)) / 60000);
        }
        return {
          ...c,
          aguardandoMin,
          ultimaMsgCliente: ultimaMsgCliente ? new Date(ultimaMsgCliente.createdAt) : null
        };
      });
      const lista = await Promise.all(mensagensPromises);
      // Ordena: quem está aguardando há mais tempo primeiro
      lista.sort((a, b) => {
        if (b.aguardandoMin === null && a.aguardandoMin === null) return new Date(b.updatedAt) - new Date(a.updatedAt);
        if (a.aguardandoMin === null) return 1;
        if (b.aguardandoMin === null) return -1;
        return b.aguardandoMin - a.aguardandoMin;
      });
      setAtendimentos(lista.slice(0, 10));
    }
    fetchData();
  }, []);

  return (
    <div className="bg-gradient-to-r from-[#232946] to-[#181C2A] p-6 rounded-xl shadow-lg flex flex-col gap-2 border border-cyan-900 min-w-[320px]">
      <h2 className="text-lg font-bold text-cyan-200 mb-2 flex items-center gap-2">
        <span role="img" aria-label="detalhe">📋</span> Detalhamento dos Atendimentos
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs text-cyan-100">
          <thead>
            <tr className="bg-[#181C2A]">
              <th className="px-2 py-1 text-left">Cliente</th>
              <th className="px-2 py-1 text-left">Cidade</th>
              <th className="px-2 py-1 text-left">Atendente</th>
              <th className="px-2 py-1 text-left">Status</th>
              <th className="px-2 py-1 text-left">Aguardando há (min)</th>
              <th className="px-2 py-1 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {atendimentos.map((a) => {
              const ddd = a.numero ? a.numero.substring(0,2) : '--';
              const sigla = dddSigla[ddd] || ddd;
              return (
                <tr key={a._id} className="border-b border-[#313244] hover:bg-[#232946]">
                  <td className="px-2 py-1 font-semibold">{a.nome}</td>
                  <td className="px-2 py-1">{sigla}</td>
                  <td className="px-2 py-1">{a.atendente || '-'}</td>
                  <td className="px-2 py-1">{a.status || '-'}</td>
                  <td className="px-2 py-1">{a.aguardandoMin !== null ? a.aguardandoMin : '-'}</td>
                  <td className="px-2 py-1">{new Date(a.updatedAt).toLocaleString('pt-BR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AtendimentosDetalhados; 