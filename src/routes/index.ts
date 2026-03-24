import { Router } from 'express';
import { IndexController } from '../controllers/index.controller.js';
import { ChatController } from '../controllers/chat.controller.js';

export function createRouter(
  indexController: IndexController,
  chatController: ChatController,
): Router {
  const router = Router();

  router.post('/index', indexController.index);
  router.post('/chat', chatController.chat);

  return router;
}
