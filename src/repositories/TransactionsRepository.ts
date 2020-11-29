import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find({
      select: ['value', 'type'],
    });

    const { income, outcome } = transactions.reduce(
      (acc: Omit<Balance, 'total'>, transaction: Transaction) => ({
        income:
          transaction.type === 'income'
            ? acc.income + transaction.value
            : acc.income,
        outcome:
          transaction.type === 'outcome'
            ? acc.outcome + transaction.value
            : acc.outcome,
      }),
      { income: 0, outcome: 0 },
    ) as Omit<Balance, 'total'>;

    const total = income - outcome;

    return {
      income,
      outcome,
      total,
    };
  }
}

export default TransactionsRepository;
