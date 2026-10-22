import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth';
import { validateBody } from '../../middlewares/validate';
import { createExpenseSchema } from './expenses.schema';
import * as expensesController from './expenses.controller';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/', expensesController.getExpenses);
router.post('/', validateBody(createExpenseSchema), expensesController.createExpense);
router.delete('/:id', expensesController.deleteExpense);

export default router;
