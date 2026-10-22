import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { auditService } from '../audit/audit.service';

export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await usersService.getAllUsers();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.createUser(req.body);

    await auditService.log({
      userId: req.user?.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      newValues: { email: user.email, role: user.role, name: user.name },
      ipAddress: req.ip,
    });

    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await usersService.updateStatus(id, isActive);

    await auditService.log({
      userId: req.user?.id,
      action: 'USER_STATUS_UPDATED',
      entityType: 'User',
      entityId: id,
      newValues: { isActive },
      ipAddress: req.ip,
    });

    res.json({ data: updated });
  } catch (error) {
    next(error);
  }
}
