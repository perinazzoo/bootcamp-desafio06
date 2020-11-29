import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class AddValueFieldToTransactions1606689635420
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'value',
        type: 'numeric',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transactions', 'value');
  }
}
