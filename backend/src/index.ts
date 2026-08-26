import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(
  cors({
    origin: '*', // Allow Vercel deployments and local development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// API routes
app.use('/api', router);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Counter Simulación API',
    status: 'online',
    healthCheck: '/api/health',
    documentation: 'API para toma de tiempos en sistemas de colas (Simulación)',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
