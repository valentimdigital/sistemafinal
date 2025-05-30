import React, { useState, useEffect } from 'react';
import { FaInfoCircle, FaUsers, FaTasks, FaCommentDots, FaFolderOpen } from 'react-icons/fa';

const abas = [
  { nome: 'Informações', icone: <FaInfoCircle /> },
  { nome: 'Participantes', icone: <FaUsers /> },
  { nome: 'Tarefas', icone: <FaTasks /> },
  { nome: 'Comentários', icone: <FaCommentDots /> },
  { nome: 'Arquivos', icone: <FaFolderOpen /> },
];

function InfoPanel({ contato, totalMensagens = 0 }) {
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const autor = localStorage.getItem('atendente') || 'Equipe';

  // Buscar comentários ao abrir a aba ou mudar de contato
  useEffect(() => {
    if (abaAtiva === 3 && contato?._id) {
      setCarregandoComentarios(true);
      fetch(`/api/contatos/${contato._id}/comentarios`)
        .then(res => res.json())
        .then(data => {
          setComentarios(Array.isArray(data) ? data.reverse() : []);
          setCarregandoComentarios(false);
        });
    }
  }, [abaAtiva, contato?._id]);

  // Salvar atendente no localStorage ao abrir o painel
  useEffect(() => {
    if (contato && window.atendente) {
      localStorage.setItem('atendente', window.atendente);
    }
  }, [contato]);

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    setEnviando(true);
    await fetch(`/api/contatos/${contato._id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: novoComentario, autor })
    });
    setNovoComentario('');
    // Recarregar comentários
    fetch(`/api/contatos/${contato._id}/comentarios`)
      .then(res => res.json())
      .then(data => setComentarios(Array.isArray(data) ? data.reverse() : []));
    setEnviando(false);
  };

  if (!contato) {
    return (
      <div className="w-full lg:w-1/4 min-w-[260px] max-w-[350px] bg-accent border-l border-border p-6 flex flex-col items-center">
        <div className="text-primaryLight/60 text-center">Selecione um contato</div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex flex-col bg-accent border-l border-border">
      <div className="flex flex-col items-center p-8 pb-4 border-b border-border bg-white/90 shadow-sm">
        <img
          src={contato.avatar || `https://ui-avatars.com/api/?name=${contato.nome}`}
          alt="Avatar"
          className="rounded-full w-24 h-24 sm:w-28 sm:h-28 border-4 border-primaryLight mb-2 shadow object-cover"
        />
        <div className="text-lg sm:text-xl font-bold text-primary mb-0.5 text-center truncate w-full max-w-[90%]">{contato.nome}</div>
        <div className="text-xs text-primaryLight mb-1 text-center truncate w-full max-w-[90%]">{contato.numero}</div>
        <div className="mb-3 w-full flex justify-center">
          <div className="text-primary bg-blue-50 px-3 py-1.5 rounded-lg text-center font-semibold tracking-widest shadow border border-primary/10 w-full max-w-[220px] text-xs sm:text-sm">
            <span className="font-medium">PROTOCOLO:</span> <span className="ml-1">{contato.protocolo || '---'}</span>
          </div>
        </div>
        <div className="flex justify-between w-full mb-2 gap-2">
          <div className="flex flex-col items-center flex-1">
            <span className="text-primary text-base sm:text-lg font-bold">1</span>
            <span className="text-xs text-primaryLight">Atendimentos</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-primary text-base sm:text-lg font-bold">{totalMensagens}</span>
            <span className="text-xs text-primaryLight">Mensagens</span>
          </div>
        </div>
      </div>
      {/* Abas/menus */}
      <div className="flex border-b border-border bg-card">
        {abas.map((aba, idx) => (
          <button
            key={aba.nome}
            onClick={() => setAbaAtiva(idx)}
            className={`flex-1 py-3 sm:py-3.5 flex flex-col items-center gap-1 text-xs font-semibold transition-colors whitespace-nowrap ${
              abaAtiva === idx
                ? 'text-primary border-b-4 border-primaryLight bg-accent'
                : 'text-primaryLight hover:bg-accent/60'
            }`}
          >
            {aba.icone}
            {aba.nome}
          </button>
        ))}
      </div>
      {/* Conteúdo da aba ativa */}
      <div className="flex-1 p-6 sm:p-8 bg-accent/80 overflow-y-auto">
        {/* Exemplo de conteúdo dinâmico */}
        {abaAtiva === 0 && (
          <div className="text-primary text-sm space-y-2">
            <div><b>Nome:</b> {contato.nome}</div>
            <div><b>Número:</b> {contato.numero}</div>
            <div><b>Protocolo:</b> {contato.protocolo || '---'}</div>
            {/* Adicione mais informações aqui */}
          </div>
        )}
        {abaAtiva === 1 && <div className="text-primaryLight">Participantes do atendimento...</div>}
        {abaAtiva === 2 && <div className="text-primaryLight">Tarefas relacionadas...</div>}
        {abaAtiva === 3 && (
          <div className="flex flex-col gap-4 h-full">
            <form onSubmit={handleEnviarComentario} className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 p-2 rounded border border-border bg-white text-primary"
                placeholder="Adicionar comentário interno..."
                value={novoComentario}
                onChange={e => setNovoComentario(e.target.value)}
                disabled={enviando}
              />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded font-bold disabled:opacity-50" disabled={enviando || !novoComentario.trim()}>Enviar</button>
            </form>
            {carregandoComentarios ? (
              <div className="text-primaryLight">Carregando comentários...</div>
            ) : comentarios.length === 0 ? (
              <div className="text-primaryLight">Nenhum comentário interno ainda.</div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px]">
                {comentarios.map((c, i) => (
                  <div key={i} className="bg-white rounded p-2 shadow border border-border">
                    <div className="text-xs text-primary font-bold mb-1">{c.autor || 'Equipe'} <span className="text-primaryLight">{new Date(c.data).toLocaleString('pt-BR')}</span></div>
                    <div className="text-primary text-sm">{c.texto}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {abaAtiva === 4 && <div className="text-primaryLight">Arquivos compartilhados...</div>}
      </div>
    </div>
  );
}

export default InfoPanel; 