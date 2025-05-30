import mongoose from 'mongoose';
import cron from 'node-cron';
import Atendimento from '../models/Atendimento.js';

const MONGODB_URI = 'mongodb+srv://valentina:Q3zbZeyl9uBEBXSa@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina';
const GRUPO_ID = '120363399448772089@g.us';

// Função para gerar o relatório
export async function gerarRelatorio() {
    try {
        // Garantir que estamos conectados ao MongoDB
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(MONGODB_URI);
        }

        const dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
        
        const dataFim = new Date();
        dataFim.setHours(23, 59, 59, 999);

        // Buscar todos os atendimentos do dia
        const atendimentos = await Atendimento.find({
            timestamp: {
                $gte: dataInicio,
                $lte: dataFim
            }
        });

        // Contadores
        const contadores = {
            cnpjs: 0,
            fibras: 0,
            contratos: 0,
            portabilidades: 0,
            linhasNovas: 0
        };

        // Processar atendimentos
        atendimentos.forEach(atendimento => {
            if (atendimento.fluxo === 'CNPJ' && atendimento.status === 'finalizado') {
                contadores.cnpjs++;
            }
            if (atendimento.fluxo === 'Fibra' && atendimento.status === 'finalizado') {
                contadores.fibras++;
            }
            if (atendimento.status === 'finalizado') {
                contadores.contratos++;
            }
            if (atendimento.fluxo === 'Portabilidade' && atendimento.status === 'finalizado') {
                contadores.portabilidades++;
                if (atendimento.novas_linhas) {
                    contadores.linhasNovas += atendimento.novas_linhas;
                }
            }
        });

        // Gerar texto do relatório
        const relatorio = `📊 *RELATÓRIO ${dataFim.getHours()}:${String(dataFim.getMinutes()).padStart(2, '0')}*\n\n` +
            `🏢 CNPJs: ${contadores.cnpjs}\n` +
            `🔌 Fibras: ${contadores.fibras}\n` +
            `📝 Contratos: ${contadores.contratos}\n` +
            `📱 Portabilidades: ${contadores.portabilidades}\n` +
            `➕ Linhas Novas: ${contadores.linhasNovas}`;

        // Se for 18:00, adicionar resumo total do dia
        if (dataFim.getHours() === 18) {
            const resumoTotal = `\n\n📈 *RESUMO TOTAL DO DIA*\n` +
                `Total de CNPJs: ${contadores.cnpjs}\n` +
                `Total de Fibras: ${contadores.fibras}\n` +
                `Total de Contratos: ${contadores.contratos}\n` +
                `Total de Portabilidades: ${contadores.portabilidades}\n` +
                `Total de Linhas Novas: ${contadores.linhasNovas}`;
            
            return relatorio + resumoTotal;
        }

        return relatorio;
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        return '❌ Erro ao gerar relatório automático';
    }
}

// Configurar os horários dos relatórios
export function configurarRelatoriosAutomaticos(enviarMensagem) {
    // Função auxiliar para enviar relatório
    const enviarRelatorio = async () => {
        try {
            const relatorio = await gerarRelatorio();
            await enviarMensagem(GRUPO_ID, relatorio);
            console.log('✅ Relatório enviado com sucesso para o grupo:', GRUPO_ID);
        } catch (error) {
            console.error('❌ Erro ao enviar relatório:', error);
        }
    };

    // 10:00
    cron.schedule('0 10 * * *', enviarRelatorio);

    // 13:00
    cron.schedule('0 13 * * *', enviarRelatorio);

    // 13:20
    cron.schedule('20 13 * * *', enviarRelatorio);

    // 15:00
    cron.schedule('0 15 * * *', enviarRelatorio);

    // 17:00
    cron.schedule('0 17 * * *', enviarRelatorio);

    // 18:00 (com resumo total do dia)
    cron.schedule('0 18 * * *', enviarRelatorio);

    console.log('✅ Relatórios automáticos configurados com sucesso para os horários:');
    console.log('   - 10:00');
    console.log('   - 13:00');
    console.log('   - 13:20');
    console.log('   - 15:00');
    console.log('   - 17:00');
    console.log('   - 18:00 (com resumo total do dia)');
} 