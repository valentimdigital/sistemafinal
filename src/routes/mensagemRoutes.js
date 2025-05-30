import express from 'express';
import { getSocket } from '../config/socket.js';
import { temEtiquetaAtencao } from '../utils/labelUtils.js';

const router = express.Router();

// Rota para enviar mensagem com verificação de etiqueta ATENCAO
router.post('/enviar-msg', async (req, res) => {
    try {
        const { numero, texto } = req.body;

        if (!numero || !texto) {
            return res.status(400).json({
                status: 'erro',
                mensagem: 'Número e texto são obrigatórios'
            });
        }

        // Verifica se o número tem a etiqueta ATENCAO
        const ignorar = await temEtiquetaAtencao(numero);
        if (ignorar) {
            return res.status(200).json({
                status: 'ignorado',
                motivo: 'etiqueta ATENCAO'
            });
        }

        // Pega a instância do socket
        const sock = getSocket();
        if (!sock) {
            return res.status(500).json({
                status: 'erro',
                mensagem: 'WhatsApp não conectado'
            });
        }

        // Formata o número se necessário
        const numeroCompleto = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;

        // Envia a mensagem
        await sock.sendMessage(numeroCompleto, { text: texto });

        res.status(200).json({
            status: 'enviado',
            numero: numeroCompleto,
            texto: texto
        });

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            status: 'erro',
            mensagem: 'Erro ao enviar mensagem',
            erro: error.message
        });
    }
});

export default router; 