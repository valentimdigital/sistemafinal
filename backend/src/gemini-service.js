import axios from 'axios';
import { SYS_PROMPT } from './ai-config.js';

const GEMINI_API_KEY = 'AIzaSyBKZYCi_cyMmUuMDvDOgYJx62dKtSipSVc';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function getAIResponse(contexto) {
    try {
        console.log('[LOG Gemini] Preparando chamada para Gemini 2.0 Flash');
        
        // Formatar o contexto para melhor compreensão
        const formattedContext = typeof contexto === 'string' 
            ? contexto 
            : Array.isArray(contexto) 
                ? contexto.join('\n')
                : JSON.stringify(contexto);

        console.log('[LOG Gemini] Contexto formatado:', formattedContext);

        const requestBody = {
            contents: [{
                parts: [
                    { text: SYS_PROMPT },
                    { text: formattedContext }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        console.log('[LOG Gemini] Enviando requisição para API:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.data.candidates || !response.data.candidates[0]) {
            console.error('[ERRO Gemini] Resposta inválida da API:', response.data);
            throw new Error('Resposta inválida da API Gemini');
        }

        const aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log('[LOG Gemini] Resposta recebida da IA:', aiResponse);
        return aiResponse;
    } catch (error) {
        console.error('[ERRO Gemini] Erro detalhado:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
        return 'Desculpe, não consegui processar sua mensagem no momento. Pode tentar novamente?';
    }
}

export { getAIResponse }; 