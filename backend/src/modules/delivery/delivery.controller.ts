import { Request, Response, NextFunction } from 'express';
import { deliveryService } from './delivery.service';

export async function getAllDeliveryZones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const zones = await deliveryService.getAllDeliveryZones();
    res.json({ data: zones });
  } catch (error) {
    next(error);
  }
}
