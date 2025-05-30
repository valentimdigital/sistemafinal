// Função para extrair o DDD de um número brasileiro em qualquer formato
export function extrairDDD(numero) {
  if (!numero) return '21';
  const num = numero.replace(/\D/g, '');
  if (num.length >= 13 && num.startsWith('55')) return num.slice(2, 4);
  if (num.length === 12 && num.startsWith('0')) return num.slice(1, 3);
  if (num.length === 11) return num.slice(0, 2);
  if (num.length === 9) return '21'; // padrão se só vier o número
  return '21'; // fallback padrão
} 