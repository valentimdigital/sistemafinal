import React from 'react';

const ATENDENTES = [
  'Todos',
  'Wellington Ribeiro',
  'Ana Cunha',
  'Thayná Freitas',
  'Livia Martins',
  'Valentim',
  'Valentina (IA)'
];

function Topbar({ atendente, setAtendente, onAtribuirAtendente, contatoSelecionado }) {
  return (
    <div className="w-full flex items-center justify-between bg-[#181C2A] px-2 sm:px-6 py-2 sm:py-3 shadow z-50 gap-2 sm:gap-0">
      {/* Logos */}
      <div className="flex items-center gap-2 min-w-0 w-full">
        <img src="/logos/principal.webp" alt="Logo Principal" className="h-8 w-auto sm:h-10" />
        <span className="hidden md:block flex-grow"></span>
        <span className="ml-2 text-blue-100 font-semibold text-lg sm:text-xl drop-shadow-sm bg-[#232946]/30 px-3 py-1 rounded-lg whitespace-nowrap mx-auto md:mx-0 md:absolute md:left-1/2 md:-translate-x-1/2">Desperte novas possibilidades</span>
        <span className="hidden md:block flex-grow"></span>
        <img src="/logos/secundaria.png" alt="Logo Secundária" className="h-10 w-auto hidden md:block" />
      </div>
      {/* Dropdown de atendente */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <span className="text-blue-100 font-semibold text-xs sm:text-sm whitespace-nowrap">Atendente:</span>
        <select
          className="rounded px-2 sm:px-3 py-1 bg-[#232946] text-blue-100 font-semibold focus:outline-none max-w-[160px] sm:max-w-xs truncate"
          value={atendente}
          onChange={e => setAtendente(e.target.value)}
        >
          {ATENDENTES.map(nome => (
            <option key={nome} value={nome}>{nome}</option>
          ))}
        </select>
        <button
          className="ml-2 px-3 py-1 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          disabled={!contatoSelecionado || atendente === 'Todos'}
          onClick={() => onAtribuirAtendente && onAtribuirAtendente()}
        >Atribuir</button>
      </div>
    </div>
  );
}

export default Topbar; 