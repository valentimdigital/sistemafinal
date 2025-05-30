import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axiosConfig';
import './discadora-styles.css';

const Discadora = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteAtual, setClienteAtual] = useState(0);
  const [filtroStatus, setFiltroStatus] = useState('nao-atendidos');
  const [observacoes, setObservacoes] = useState('');
  const [statusAtendeu, setStatusAtendeu] = useState(false);
  const [statusAtencao, setStatusAtencao] = useState(false);
  const [statusFechamento, setStatusFechamento] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, [filtroStatus]);

  const carregarClientes = async () => {
    try {
      const response = await axios.get('/api/discadora/clientes');
      let filtrados = response.data;
      if (filtroStatus === 'nao-atendidos') {
        filtrados = filtrados.filter(c => c.status !== 'atendido');
      } else if (filtroStatus === 'atendidos') {
        filtrados = filtrados.filter(c => c.status === 'atendido');
      }
      setClientes(filtrados);
      setClienteAtual(0);
      resetarStatus(filtrados[0]);
    } catch (error) {
      setClientes([]);
    }
  };

  const resetarStatus = (cliente) => {
    if (!cliente) return;
    setStatusAtendeu(cliente.statusAtendeu || false);
    setStatusAtencao(cliente.statusAtencao || false);
    setStatusFechamento(cliente.statusFechamento || false);
    setObservacoes(cliente.observacoes || '');
  };

  const cliente = clientes[clienteAtual] || {};

  const salvarAtendimento = async () => {
    if (!cliente._id) return;
    try {
      await axios.put(`/api/discadora/clientes/${cliente._id}`, {
        statusAtendeu,
        statusAtencao,
        statusFechamento,
        observacoes,
        status: statusAtendeu ? 'atendido' : 'nao-atendido',
      });
      carregarClientes();
      alert('Atendimento salvo!');
    } catch (error) {
      alert('Erro ao salvar atendimento.');
    }
  };

  const navegar = (dir) => {
    let novo = clienteAtual + dir;
    if (novo < 0) novo = 0;
    if (novo >= clientes.length) novo = clientes.length - 1;
    setClienteAtual(novo);
    resetarStatus(clientes[novo]);
  };

  return (
    <div className="container">
      <header>
        <h1>Sistema de Atendimento Valentim Digital</h1>
        <nav>
          <ul>
            <li><Link to="/discadora/atendimento" className="active">Atendimento</Link></li>
            <li><Link to="/discadora/relatorio">Relatório</Link></li>
            <li><Link to="/discadora/adicionarcliente">Adicionar Cliente</Link></li>
          </ul>
        </nav>
      </header>
      <main>
        <div className="card cliente-card">
          <div className="card-header">
            <h2>Dados do Cliente</h2>
            <div className="filtro-container">
              <label htmlFor="filtroStatus">Filtrar:</label>
              <select id="filtroStatus" className="filtro-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="nao-atendidos">Não Atendidos</option>
                <option value="atendidos">Atendidos</option>
              </select>
            </div>
            <div className="navegacao">
              <button id="btnAnterior" className="btn btn-nav" onClick={() => navegar(-1)} disabled={clienteAtual === 0}><i className="fas fa-arrow-left"></i> Anterior</button>
              <span id="clienteAtual">{clientes.length ? clienteAtual + 1 : 0}</span> / <span id="totalClientes">{clientes.length}</span>
              <button id="btnProximo" className="btn btn-nav" onClick={() => navegar(1)} disabled={clienteAtual === clientes.length - 1}>Próximo <i className="fas fa-arrow-right"></i></button>
            </div>
          </div>
          <div className="card-body">
            <div id="statusAtendimento" className={`status-atendimento ${statusAtendeu ? 'atendido' : 'nao-atendido'}`}>
              {statusAtendeu ? 'CLIENTE ATENDIDO' : 'CLIENTE NÃO ATENDIDO'}
            </div>
            <div className="telefone-destaque">
              <label>TELEFONE:</label>
              <p id="telefoneCliente">{cliente.telefone || '-'}</p>
            </div>
            <div className="cliente-info">
              <div className="info-row">
                <div className="info-group">
                  <label>Nome:</label>
                  <p id="nomeCliente">{cliente.nome || '-'}</p>
                </div>
                <div className="info-group">
                  <label>CNPJ:</label>
                  <p id="cnpjCliente">{cliente.cnpj || '-'}</p>
                </div>
                <div className="info-group">
                  <label>Cidade:</label>
                  <p id="cidadeCliente">{cliente.cidade || '-'}</p>
                </div>
              </div>
            </div>
            <div className="status-buttons">
              <div className="status-group">
                <label>Cliente atendeu?</label>
                <div className="toggle-buttons">
                  <button className={`btn btn-toggle${statusAtendeu ? ' active' : ''}`} onClick={() => setStatusAtendeu(true)}>Sim</button>
                  <button className={`btn btn-toggle${!statusAtendeu ? ' active' : ''}`} onClick={() => setStatusAtendeu(false)}>Não</button>
                </div>
              </div>
              <div className="status-group">
                <label>Cliente deu atenção?</label>
                <div className="toggle-buttons">
                  <button className={`btn btn-toggle${statusAtencao ? ' active' : ''}`} onClick={() => setStatusAtencao(true)}>Sim</button>
                  <button className={`btn btn-toggle${!statusAtencao ? ' active' : ''}`} onClick={() => setStatusAtencao(false)}>Não</button>
                </div>
              </div>
              <div className="status-group">
                <label>Possibilidade de fechamento?</label>
                <div className="toggle-buttons">
                  <button className={`btn btn-toggle${statusFechamento ? ' active' : ''}`} onClick={() => setStatusFechamento(true)}>Sim</button>
                  <button className={`btn btn-toggle${!statusFechamento ? ' active' : ''}`} onClick={() => setStatusFechamento(false)}>Não</button>
                </div>
              </div>
            </div>
            <div className="observacoes">
              <label htmlFor="txtObservacoes">Observações:</label>
              <textarea id="txtObservacoes" rows="4" placeholder="Registre aqui suas observações sobre o atendimento..." value={observacoes} onChange={e => setObservacoes(e.target.value)}></textarea>
            </div>
            <div className="actions">
              <button id="btnSalvar" className="btn btn-primary" onClick={salvarAtendimento}>Salvar Atendimento</button>
            </div>
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2025 Sistema de Atendimento Valentim Digital</p>
      </footer>
    </div>
  );
};

export default Discadora; 