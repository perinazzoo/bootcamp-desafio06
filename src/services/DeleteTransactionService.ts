import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { affected } = await transactionsRepository.delete({ id });

    if (!affected || affected === 0) {
      throw new AppError('This transaction does not exists.', 404);
    }
  }
}

export default DeleteTransactionService;
