import React, { useState, useEffect } from 'react';
import { Box, Grid, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Switch, Typography, Paper, Divider } from '@mui/material';
import { Archive, Chat as ChatIcon } from '@mui/icons-material';
import { api } from '../axiosConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Painel() {
  const [contatos, setContatos] = useState([]);
  const [botAtivo, setBotAtivo] = useState(true);
  const [iaAtiva, setIaAtiva] = useState(true);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarContatos();
    carregarConfiguracoesBot();
  }, []);

  const carregarContatos = async () => {
    try {
      const response = await api.get('/api/contatos');
      setContatos(response.data);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarConfiguracoesBot = async () => {
    try {
      const response = await api.get('/api/config/bot');
      setBotAtivo(response.data.botAtivo);
      setIaAtiva(response.data.iaAtiva);
    } catch (error) {
      console.error('Erro ao carregar configurações do bot:', error);
    }
  };

  const alternarBot = async () => {
    try {
      await api.post('/api/config/bot', {
        botAtivo: !botAtivo,
        iaAtiva
      });
      setBotAtivo(!botAtivo);
    } catch (error) {
      console.error('Erro ao alterar estado do bot:', error);
    }
  };

  const alternarIA = async () => {
    try {
      await api.post('/api/config/bot', {
        botAtivo,
        iaAtiva: !iaAtiva
      });
      setIaAtiva(!iaAtiva);
    } catch (error) {
      console.error('Erro ao alterar estado da IA:', error);
    }
  };

  const arquivarContato = async (telefone) => {
    try {
      await api.post(`/api/contatos/${telefone}/arquivar`);
      carregarContatos(); // Recarrega a lista após arquivar
    } catch (error) {
      console.error('Erro ao arquivar contato:', error);
    }
  };

  return (
    <Box p={3}>
      <Grid container spacing={3}>
        {/* Painel de Controle */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Controle do Bot
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="space-around">
              <Box>
                <Typography component="span">Menu do Bot</Typography>
                <Switch
                  checked={botAtivo}
                  onChange={alternarBot}
                  color="primary"
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box>
                <Typography component="span">Respostas IA</Typography>
                <Switch
                  checked={iaAtiva}
                  onChange={alternarIA}
                  color="secondary"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Lista de Contatos */}
        <Grid item xs={12}>
          <Paper elevation={3}>
            <List>
              {carregando ? (
                <ListItem>
                  <ListItemText primary="Carregando contatos..." />
                </ListItem>
              ) : contatos.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Nenhum contato encontrado" />
                </ListItem>
              ) : (
                contatos.map((contato) => (
                  <ListItem key={contato.telefone}>
                    <ListItemText
                      primary={contato.nome || contato.telefone}
                      secondary={`Última mensagem: ${format(new Date(contato.ultimaMensagem), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="chat"
                        onClick={() => window.open(`https://wa.me/${contato.telefone}`, '_blank')}
                      >
                        <ChatIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="arquivar"
                        onClick={() => arquivarContato(contato.telefone)}
                      >
                        <Archive />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 