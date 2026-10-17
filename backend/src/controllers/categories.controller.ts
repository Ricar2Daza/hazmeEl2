import { Request, Response, NextFunction } from 'express';
import * as categoriesService from '../services/categories.service';

const list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await categoriesService.listAll();
    res.status(200).json({
      status: 'success',
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

export default { list };
