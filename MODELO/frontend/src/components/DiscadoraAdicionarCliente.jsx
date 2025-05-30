import React, { useState } from 'react';
import './discadora-styles.css';
import { api as axios } from '../axiosConfig';

const DiscadoraAdicionarCliente = () => {
  const [form, setForm] = useState({
    telefone: '',
    nome: '',
    cnpj: '',
    cidade: '',
    observacoes: ''
  });
  const [status, setStatus] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('');
    try {
      await axios.post('/api/discadora/clientes', form);
      setForm({ telefone: '', nome: '', cnpj: '', cidade: '', observacoes: '' });
      setStatus('success');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Sistema de Atendimento Valentim Digital</h1>
        <nav>
          <ul>
            <li><a href="/discadora/atendimento">Atendimento</a></li>
            <li><a href="/discadora/relatorio">Relatório</a></li>
            <li><a href="/discadora/adicionarcliente" className="active">Adicionar Cliente</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <div className="card">
          <div className="card-header">
            <h2>Adicionar Novo Cliente</h2>
          </div>
          <div className="card-body">
            <form id="formAdicionarCliente" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="telefone">Telefone:</label>
                <input type="text" id="telefone" name="telefone" className="form-control" placeholder="Ex: 5511987654321" required value={form.telefone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="nome">Nome:</label>
                <input type="text" id="nome" name="nome" className="form-control" placeholder="Nome da empresa ou cliente" value={form.nome} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="cnpj">CNPJ:</label>
                <input type="text" id="cnpj" name="cnpj" className="form-control" placeholder="Ex: 12.345.678/0001-90" value={form.cnpj} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="cidade">Cidade:</label>
                <input type="text" id="cidade" name="cidade" className="form-control" placeholder="Ex: São Paulo" value={form.cidade} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="observacoes">Observações Iniciais:</label>
                <textarea id="observacoes" name="observacoes" className="form-control" rows="4" placeholder="Informações iniciais sobre o cliente..." value={form.observacoes} onChange={handleChange}></textarea>
              </div>
              <div className="actions">
                <button type="submit" id="btnAdicionar" className="btn btn-primary">Adicionar Cliente</button>
              </div>
              {status === 'success' && <div style={{color: 'green', marginTop: 10}}>Cliente adicionado com sucesso!</div>}
              {status === 'error' && <div style={{color: 'red', marginTop: 10}}>Erro ao adicionar cliente.</div>}
            </form>
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2025 Sistema de Atendimento Valentim Digital</p>
      </footer>
    </div>
  );
};

export default DiscadoraAdicionarCliente; 