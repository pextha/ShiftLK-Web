import { Request, Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expense = await expensesService.createExpense(req.body, req.user?.id);
    res.status(201).json({ data: expense });
  } catch (error) {
    next(error);
  }
}

export async function getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type, startDate, endDate, page, limit } = req.query;
    const result = await expensesService.getExpenses({
      type: type as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    await expensesService.deleteExpense(id);
    res.json({ data: { message: 'Expense deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
