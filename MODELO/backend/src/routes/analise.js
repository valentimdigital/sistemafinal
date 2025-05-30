import express from 'express';
import Mensagem from '../models/Mensagem.js';
import Contato from '../models/Contato.js';

const router = express.Router();

// Função para analisar sentimento
async function analisarSentimento(conteudo) {
    const palavrasPositivas = ['ótimo', 'excelente', 'bom', 'gostei', 'recomendo', 'parabéns', 'obrigado'];
    const palavrasNegativas = ['problema', 'erro', 'falha', 'não funciona', 'ruim', 'péssimo', 'horrível', 'cancelar', 'devolver'];
    
    const conteudoLower = conteudo.toLowerCase();
    const positivos = palavrasPositivas.filter(p => conteudoLower.includes(p)).length;
    const negativos = palavrasNegativas.filter(p => conteudoLower.includes(p)).length;
    
    if (positivos > negativos) return 'positivo';
    if (negativos > positivos) return 'negativo';
    return 'neutro';
}

// Rota para análise de sentimento de um contato específico
router.get('/sentimento/:contatoId', async (req, res) => {
    try {
        const { contatoId } = req.params;
        const mensagens = await Mensagem.find({ contato: contatoId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const analises = await Promise.all(mensagens.map(async (msg) => {
            const sentimento = await analisarSentimento(msg.conteudo);
            return {
                ...msg,
                sentimento
            };
        }));

        const contato = await Contato.findById(contatoId);
        
        res.json({
            contato: {
                nome: contato?.nome || 'Desconhecido',
                numero: contato?.numero || 'N/A'
            },
            analises
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao analisar sentimento', details: error.message });
    }
});

// Rota para análise geral de sentimentos
router.get('/geral', async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: '$contato',
                    totalMensagens: { $sum: 1 },
                    mensagens: { $push: '$conteudo' }
                }
            }
        ];

        const resultados = await Mensagem.aggregate(pipeline);
        
        const analises = await Promise.all(resultados.map(async (resultado) => {
            const contato = await Contato.findById(resultado._id);
            const sentimentos = await Promise.all(
                resultado.mensagens.map(msg => analisarSentimento(msg))
            );
            
            const positivos = sentimentos.filter(s => s === 'positivo').length;
            const negativos = sentimentos.filter(s => s === 'negativo').length;
            const neutros = sentimentos.filter(s => s === 'neutro').length;
            
            return {
                contato: {
                    nome: contato?.nome || 'Desconhecido',
                    numero: contato?.numero || 'N/A'
                },
                totalMensagens: resultado.totalMensagens,
                sentimentos: {
                    positivos,
                    negativos,
                    neutros
                }
            };
        }));

        res.json(analises);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao analisar sentimentos gerais', details: error.message });
    }
});

// Rota para estatísticas em tempo real
router.get('/estatisticas-tempo-real', async (req, res) => {
    try {
        const pipeline = [
            {
                $facet: {
                    'totalMensagens': [
                        { $count: 'total' }
                    ],
                    'mensagensPorStatus': [
                        {
                            $group: {
                                _id: '$status',
                                total: { $sum: 1 }
                            }
                        }
                    ],
                    'mensagensPorHora': [
                        {
                            $group: {
                                _id: {
                                    hora: { $hour: '$createdAt' },
                                    dia: { $dayOfMonth: '$createdAt' }
                                },
                                total: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.dia': 1, '_id.hora': 1 } }
                    ],
                    'sentimentos': [
                        {
                            $group: {
                                _id: '$sentimento',
                                total: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ];

        const estatisticas = await Mensagem.aggregate(pipeline);
        
        // Formata os resultados
        const resultado = {
            totalMensagens: estatisticas[0].totalMensagens[0]?.total || 0,
            mensagensPorStatus: estatisticas[0].mensagensPorStatus.reduce((acc, curr) => {
                acc[curr._id] = curr.total;
                return acc;
            }, {}),
            mensagensPorHora: estatisticas[0].mensagensPorHora.map(item => ({
                hora: item._id.hora,
                dia: item._id.dia,
                total: item.total
            })),
            sentimentos: estatisticas[0].sentimentos.reduce((acc, curr) => {
                acc[curr._id] = curr.total;
                return acc;
            }, {})
        };

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar estatísticas', details: error.message });
    }
});

export default router; 