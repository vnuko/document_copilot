import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service.js';

export class ChatController {
  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { input, debug } = req.body;

      if (!input || typeof input !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Input is required and must be a string',
        });
        return;
      }

      if (debug === true) {
        const result = await chatService.chatWithDebug(input);
        res.status(200).json({
          success: true,
          ...result,
        });
        return;
      }

      const output = await chatService.chat(input);

      res.status(200).json({
        success: true,
        output,
      });
    } catch (error) {
      next(error);
    }
  };
}