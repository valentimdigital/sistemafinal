import React, { useState, useEffect } from 'react';
import './discadora-styles.css';
import axios from '../axiosConfig';

const DiscadoraRelatorio = () => {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtrados, setFiltrados] = useState([]);

  useEffect(() => {
    carregarClientes();
  }, []);

  useEffect(() => {
    filtrar();
  }, [busca, clientes]);

  const carregarClientes = async () => {
    try {
      const response = await axios.get('/api/discadora/clientes');
      setClientes(response.data);
    } catch (error) {
      setClientes([]);
    }
  };

  const filtrar = () => {
    if (!busca) {
      setFiltrados(clientes);
      return;
    }
    const termo = busca.toLowerCase();
    setFiltrados(clientes.filter(c =>
      (c.nome && c.nome.toLowerCase().includes(termo)) ||
      (c.telefone && c.telefone.includes(termo)) ||
      (c.cnpj && c.cnpj.includes(termo))
    ));
  };

  return (
    <div className="container">
      <header>
        <h1>Sistema de Atendimento Valentim Digital</h1>
        <nav>
          <ul>
            <li><a href="/discadora/atendimento">Atendimento</a></li>
            <li><a href="/discadora/relatorio" className="active">Relatório</a></li>
            <li><a href="/discadora/adicionarcliente">Adicionar Cliente</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <div className="card relatorio-card">
          <div className="card-header">
            <h2>Relatório de Atendimentos</h2>
            <div className="filtros">
              <input type="text" placeholder="Buscar por nome, telefone ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} />
              <button className="btn btn-secondary" onClick={filtrar}>Buscar</button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table id="tabelaRelatorio">
                <thead>
                  <tr>
                    <th>Telefone</th>
                    <th>Nome</th>
                    <th>CNPJ</th>
                    <th>Cidade</th>
                    <th>Atendeu?</th>
                    <th>Deu atenção?</th>
                    <th>Fechamento?</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody id="corpoTabela">
                  {filtrados.length === 0 ? (
                    <tr><td colSpan={8} className="text-center">Nenhum registro de atendimento encontrado.</td></tr>
                  ) : (
                    filtrados.map((c, i) => (
                      <tr key={c._id || i}>
                        <td>{c.telefone || '-'}</td>
                        <td>{c.nome || '-'}</td>
                        <td>{c.cnpj || '-'}</td>
                        <td>{c.cidade || '-'}</td>
                        <td>{c.statusAtendeu ? 'Sim' : 'Não'}</td>
                        <td>{c.statusAtencao ? 'Sim' : 'Não'}</td>
                        <td>{c.statusFechamento ? 'Sim' : 'Não'}</td>
                        <td>{c.observacoes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default DiscadoraRelatorio; 