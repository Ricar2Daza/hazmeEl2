import 'dotenv/config';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { errorHandler, notFoundHandler } from './middlewares';
import { isAllowedOrigin } from './utils/corsOrigin';
import authRouter from './routes/auth.router';
import categoriesRouter from './routes/categories.router';
import jobsRouter from './routes/jobs.router';
import applicationsRouter from './routes/applications.router';
import notificationsRouter from './routes/notifications.router';
import chatRouter from './routes/chat.router';
import usersRouter from './routes/users.router';
import directRouter from './routes/direct.router';
import { swaggerSpec } from './utils/swagger';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

// Orígenes permitidos: la lista de CORS_ORIGIN más localhost y los túneles de
// ngrok en desarrollo (su subdominio cambia en cada sesión del plan gratuito).
app.use(
  cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'HazMe API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/users', usersRouter);
app.use('/api/direct', directRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
