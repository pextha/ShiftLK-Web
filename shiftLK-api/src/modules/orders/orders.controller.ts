import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';

export async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await ordersService.createOrder(req.body);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const phone = req.query.phone as string;
    const order = await ordersService.getOrderByCodeAndPhone(code, phone);
    res.json({ data: order });
  } catch (error) {
    next(error);
  }
}
