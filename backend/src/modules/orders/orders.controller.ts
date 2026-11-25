import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service';

export async function createReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId, qty } = req.body;
    const result = await ordersService.createReservation(productId, Number(qty));
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function extendReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await ordersService.extendReservation(id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function releaseReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const result = await ordersService.releaseReservation(id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
}

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
