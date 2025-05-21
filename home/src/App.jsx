import './App.css';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%)' }}>
      <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', borderRadius: '2rem', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: 400, width: '100%' }}>
        <img src="/logo_valen.png" alt="Valen TIM" style={{ width: 96, height: 96, borderRadius: '50%', boxShadow: '0 2px 8px #0002', border: '4px solid #fff3' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 8px #0006', marginBottom: 8 }}>Bem-vindo ao Sistema Valen TIM</h1>
        <p style={{ fontSize: '1.1rem', color: '#e0e7ef', textAlign: 'center', marginBottom: 16 }}>Escolha abaixo para onde deseja ir:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <a href="http://localhost:3000" style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold', padding: '1rem', borderRadius: '1rem', fontSize: '1.1rem', textAlign: 'center', textDecoration: 'none', boxShadow: '0 2px 8px #0002', transition: 'background 0.2s' }}>Acessar Atendimento</a>
          <a href="http://localhost:3002/index.html" style={{ background: '#06b6d4', color: '#fff', fontWeight: 'bold', padding: '1rem', borderRadius: '1rem', fontSize: '1.1rem', textAlign: 'center', textDecoration: 'none', boxShadow: '0 2px 8px #0002', transition: 'background 0.2s' }}>Acessar Dashboard</a>
        </div>
        <div style={{ marginTop: 24, fontSize: 12, color: '#e0e7ef99' }}>Valentina Digital &copy; {new Date().getFullYear()}</div>
      </div>
      </div>
  );
}

export default App;
