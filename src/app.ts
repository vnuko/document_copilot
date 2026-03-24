import express, { Express, Request, Response, NextFunction } from 'express';
import { createRouter } from './routes/index.js';
import { IndexController } from './controllers/index.controller.js';
import { ChatController } from './controllers/chat.controller.js';
import { databaseService } from './services/database.service.js';
import { vectorStoreService } from './services/vectorstore.service.js';
import { documentService } from './services/document.service.js';
import { chatService } from './services/chat.service.js';
import { config } from './config/index.js';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(express.json());

  await databaseService.initialize();
  await vectorStoreService.initialize();

  const indexController = new IndexController();
  const chatController = new ChatController();

  const router = createRouter(indexController, chatController);
  app.use('/api', router);

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  });

  return app;
}

export { documentService, chatService };