import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('You cannot withdraw more than you have.', 403);
    }

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    let createdCategory;

    if (!categoryExists) {
      createdCategory = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(createdCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryExists?.id || createdCategory?.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
