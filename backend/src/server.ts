import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { initSocket } from './utils/socket';
import { initMqtt, closeMqtt } from './mqtt/broker';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL conectado correctamente');

    const httpServer = createServer(app);
    initSocket(httpServer);
    console.log('✅ Socket.io inicializado');
    await initMqtt(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`\n🚀 HazMe API iniciado en puerto ${PORT}`);
      console.log(`   - Health:  http://localhost:${PORT}/api/health`);
      console.log(`   - Docs:    http://localhost:${PORT}/api/docs`);
      console.log(`   - Entorno: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ Error al iniciar el servidor:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n🛑 Apagando servidor...');
  await closeMqtt();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Apagando servidor...');
  await closeMqtt();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
