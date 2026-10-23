import { Request, Response, NextFunction } from 'express';
import { brandsService } from './brands.service';

export async function getAllBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const brands = await brandsService.getAllBrands();
    res.json({ data: brands });
  } catch (error) {
    next(error);
  }
}
