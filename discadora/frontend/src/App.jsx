import React, { useState } from 'react';
import './App.css';

function App() {
  const [cliente, setCliente] = useState({
    nome: '-',
    cnpj: '-',
    telefone: '-',
    cidade: '-',
    status: 'nao-atendido'
  });

  const [atendimento, setAtendimento] = useState({
    atendeu: false,
    atencao: false,
    fechamento: false,
    observacoes: ''
  });

  const handleStatusChange = (campo, valor) => {
    setAtendimento(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = () => {
    console.log('Salvando atendimento:', atendimento);
    // Aqui você pode adicionar a lógica para salvar no backend
  };

  return (
    <div className="container">
      <header>
        <h1>Sistema de Atendimento Valentim Digital</h1>
        <nav>
          <ul>
            <li><a href="#" className="active">Atendimento</a></li>
            <li><a href="#">Relatório</a></li>
            <li><a href="#">Adicionar Cliente</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <div className="card cliente-card">
          <div className="card-header">
            <h2>Dados do Cliente</h2>
            <div className="filtro-container">
              <label htmlFor="filtroStatus">Filtrar:</label>
              <select id="filtroStatus" className="filtro-select">
                <option value="todos">Todos</option>
                <option value="nao-atendidos" selected>Não Atendidos</option>
                <option value="atendidos">Atendidos</option>
              </select>
            </div>
            <div className="navegacao">
              <button className="btn btn-nav">Anterior</button>
              <span>1</span> / <span>0</span>
              <button className="btn btn-nav">Próximo</button>
            </div>
          </div>
          <div className="card-body">
            <div className={`status-atendimento ${cliente.status}`}>
              CLIENTE NÃO ATENDIDO
            </div>
            
            <div className="telefone-destaque">
              <label>TELEFONE:</label>
              <p>{cliente.telefone}</p>
            </div>

            <div className="cliente-info">
              <div className="info-row">
                <div className="info-group">
                  <label>Nome:</label>
                  <p>{cliente.nome}</p>
                </div>
                <div className="info-group">
                  <label>CNPJ:</label>
                  <p>{cliente.cnpj}</p>
                </div>
                <div className="info-group">
                  <label>Cidade:</label>
                  <p>{cliente.cidade}</p>
                </div>
              </div>
            </div>

            <div className="status-buttons">
              <div className="status-group">
                <label>Cliente atendeu?</label>
                <div className="toggle-buttons">
                  <button 
                    className={`btn btn-toggle ${atendimento.atendeu ? 'active' : ''}`}
                    onClick={() => handleStatusChange('atendeu', true)}
                  >
                    Sim
                  </button>
                  <button 
                    className={`btn btn-toggle ${!atendimento.atendeu ? 'active' : ''}`}
                    onClick={() => handleStatusChange('atendeu', false)}
                  >
                    Não
                  </button>
                </div>
              </div>
              <div className="status-group">
                <label>Cliente deu atenção?</label>
                <div className="toggle-buttons">
                  <button 
                    className={`btn btn-toggle ${atendimento.atencao ? 'active' : ''}`}
                    onClick={() => handleStatusChange('atencao', true)}
                  >
                    Sim
                  </button>
                  <button 
                    className={`btn btn-toggle ${!atendimento.atencao ? 'active' : ''}`}
                    onClick={() => handleStatusChange('atencao', false)}
                  >
                    Não
                  </button>
                </div>
              </div>
              <div className="status-group">
                <label>Possibilidade de fechamento?</label>
                <div className="toggle-buttons">
                  <button 
                    className={`btn btn-toggle ${atendimento.fechamento ? 'active' : ''}`}
                    onClick={() => handleStatusChange('fechamento', true)}
                  >
                    Sim
                  </button>
                  <button 
                    className={`btn btn-toggle ${!atendimento.fechamento ? 'active' : ''}`}
                    onClick={() => handleStatusChange('fechamento', false)}
                  >
                    Não
                  </button>
                </div>
              </div>
            </div>

            <div className="observacoes">
              <label htmlFor="txtObservacoes">Observações:</label>
              <textarea 
                id="txtObservacoes" 
                rows="4" 
                placeholder="Registre aqui suas observações sobre o atendimento..."
                value={atendimento.observacoes}
                onChange={(e) => handleStatusChange('observacoes', e.target.value)}
              />
            </div>

            <div className="actions">
              <button className="btn btn-primary" onClick={handleSalvar}>
                Salvar Atendimento
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer>
        <p>&copy; 2025 Sistema de Atendimento Valentim Digital</p>
      </footer>
    </div>
  );
}

export default App; 