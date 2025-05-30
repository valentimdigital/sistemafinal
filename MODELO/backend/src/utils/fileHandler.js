import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de uploads se não existir
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Função para salvar arquivo
export const saveFile = async (file, tipo) => {
  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Salvar arquivo
    await fs.promises.writeFile(filePath, file.buffer);

    // Retornar informações do arquivo
    return {
      fileName,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      url: `/uploads/${fileName}`
    };
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error);
    throw error;
  }
};

// Função para deletar arquivo
export const deleteFile = async (fileName) => {
  try {
    const filePath = path.join(uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
};

// Função para obter informações do arquivo
export const getFileInfo = async (fileName) => {
  try {
    const filePath = path.join(uploadDir, fileName);
    const stats = await fs.promises.stat(filePath);
    return {
      fileName,
      filePath,
      fileSize: stats.size,
      createdAt: stats.birthtime
    };
  } catch (error) {
    console.error('Erro ao obter informações do arquivo:', error);
    throw error;
  }
}; 