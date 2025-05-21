import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);

    // Configurações de performance
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    mongoose.set('strictQuery', true);

    // Eventos de conexão
    mongoose.connection.on('error', err => {
      console.error('Erro na conexão com MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
    });

    // Reconexão automática
    mongoose.connection.on('disconnected', () => {
      setTimeout(connectDB, 5000);
    });

  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB; 