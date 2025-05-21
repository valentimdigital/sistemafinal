import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Contato from '../models/Contato.js';

// Configurar caminho do .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://valentina:V8gdnmaxKc8K0F2R@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina";

const ddds = ['11','21','31','41','51','61','71','81','85','91','92','98','99','27','19','16','34','95','82','84','86','96','63','68','69','65','67','73','75','77','79','83','93','94','47','46','43','44','45','35','37','38'];
const cidades = ['São Paulo','Rio de Janeiro','Belo Horizonte','Curitiba','Porto Alegre','Brasília','Salvador','Recife','Fortaleza','Belém','Manaus','São Luís','Imperatriz','Vitória','Campinas','Ribeirão Preto','Uberlândia','Boa Vista','Maceió','Natal','Teresina','Macapá','Palmas','Rio Branco','Porto Velho','Cuiabá','Campo Grande','Itabuna','Feira de Santana','Barreiras','Aracaju','João Pessoa','Santarém','Marabá','Joinville','Pato Branco','Londrina','Maringá','Foz do Iguaçu','Poços de Caldas','Divinópolis','Montes Claros'];
const atendentes = ['Wellington Ribeiro','Ana Cunha','Thayná Freitas','Livia Martins','Valentim','Valentina (IA)'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTelefone(ddd) {
  // Gera um número aleatório de 8 dígitos
  return `${ddd}${randomInt(900000000, 999999999)}`;
}

function randomNome() {
  const nomes = ['João','Maria','Pedro','Ana','Lucas','Julia','Carlos','Mariana','Rafael','Larissa','Gabriel','Fernanda','Bruno','Patricia','Felipe','Camila','Rodrigo','Aline','Eduardo','Beatriz'];
  return nomes[randomInt(0, nomes.length-1)] + ' ' + nomes[randomInt(0, nomes.length-1)];
}

async function criarAtendimentosAleatorios() {
  await mongoose.connect(MONGO_URI);
  await Contato.deleteMany({});
  const contatos = [];
  for (let i = 0; i < 20; i++) {
    const dddIndex = randomInt(0, ddds.length-1);
    const ddd = ddds[dddIndex];
    const cidade = cidades[dddIndex] || `Cidade ${ddd}`;
    contatos.push({
      nome: randomNome(),
      numero: randomTelefone(ddd),
      atendente: atendentes[randomInt(0, atendentes.length-1)],
      tags: [cidade],
      status: 'andamento',
      iaAtiva: Math.random() > 0.5,
      createdAt: new Date(Date.now() - randomInt(0, 7) * 24 * 60 * 60 * 1000), // até 7 dias atrás
      updatedAt: new Date()
    });
  }
  await Contato.insertMany(contatos);
  console.log('20 atendimentos aleatórios criados com sucesso!');
  await mongoose.disconnect();
}

criarAtendimentosAleatorios(); 