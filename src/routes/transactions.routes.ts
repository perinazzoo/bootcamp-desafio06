import { Router } from 'express';
import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find({
    relations: ['category_id'],
  });

  const balance = await transactionsRepository.getBalance();

  res.json({
    transactions,
    balance,
  });
});

transactionsRouter.post('/', async (req, res) => {
  const { title, value, type, category } = req.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category,
  });

  return res.json(transaction);
});

transactionsRouter.delete('/:id', async (req, res) => {
  // TODO
});

transactionsRouter.post('/import', async (req, res) => {
  // TODO
});

export default transactionsRouter;
