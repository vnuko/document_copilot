import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';

export class IndexController {
  index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await documentService.processDocument();
      res.status(200).json({
        success: true,
        chunks: result.chunks,
        message: 'Document indexed successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}