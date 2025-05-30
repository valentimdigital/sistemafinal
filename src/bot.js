import { setSocket } from './config/socket.js';
import { handleIgnorarNumero } from './commands/ignorarNumeroHandler.js';

// ... código existente ...

// Após criar a conexão com o WhatsApp
const sock = await createConnection();
setSocket(sock);

// Adiciona o número à lista de ignorados
await handleIgnorarNumero('+5527997312281');

// ... resto do código ... 