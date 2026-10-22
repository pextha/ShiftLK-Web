import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';

export async function getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const locale = (req.query.locale as string) || 'en';
    const categories = await categoriesService.getAllCategories(locale);
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}
