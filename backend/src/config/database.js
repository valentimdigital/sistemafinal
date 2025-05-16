import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://valentina:V8gdnmaxKc8K0F2R@valentina.gdcrr.mongodb.net/?retryWrites=true&w=majority&appName=valentina";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Atlas conectado!');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB; 