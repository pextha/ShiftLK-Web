import { prisma } from '../../lib/prisma';
import { AppError } from '../../middlewares/errorHandler';

export class ExpensesService {
  async createExpense(
    data: { type: any; amount: number; date?: string; note?: string },
    userId?: string
  ) {
    return prisma.expense.create({
      data: {
        type: data.type,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        note: data.note || null,
        createdById: userId || null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getExpenses(params: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const where: any = {};
    if (params.type && params.type !== 'all') {
      where.type = params.type;
    }
    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = new Date(params.startDate);
      if (params.endDate) where.date.lte = new Date(params.endDate);
    }

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: expenses.map((e) => ({
        id: e.id,
        type: e.type,
        amount: Number(e.amount),
        date: e.date,
        note: e.note,
        createdAt: e.createdAt,
        createdBy: e.createdBy,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async deleteExpense(id: string) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('EXPENSE_NOT_FOUND', 'Expense record not found', 404);
    }

    await prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}

export const expensesService = new ExpensesService();
