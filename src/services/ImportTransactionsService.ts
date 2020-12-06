import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionRepository from '../repositories/TransactionsRepository';

import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface LoadCSV {
  categories: string[];
  transactions: CSVTransaction[];
}

async function loadCSV(filePath: string): Promise<LoadCSV> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const transactions: CSVTransaction[] = [];
  const categories: string[] = [];

  parseCSV.on('data', (line: string[]): void => {
    const cells = line.map(cell => cell.trim());

    const [title, type, value, category] = cells as [
      string,
      'income' | 'outcome',
      number,
      string,
    ];

    if (!title || !type || !value) {
      throw new AppError('The document is missing on data.', 400);
    }

    categories.push(category);
    transactions.push({
      title,
      type,
      value: Number(value),
      category,
    });
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return {
    transactions,
    categories,
  };
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(uploadConfig.directory, filename);

    const { categories, transactions } = await loadCSV(csvFilePath);

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentCategories.map(
      category => category.title,
    );

    const addCategories = categories.filter(
      (category, idx, self) =>
        !existentCategoriesTitle.includes(category) &&
        self.indexOf(category) === idx,
    );

    const newCategories = categoryRepository.create(
      addCategories.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(csvFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
