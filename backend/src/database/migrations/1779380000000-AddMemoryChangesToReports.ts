import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemoryChangesToReports1779380000000 implements MigrationInterface {
  name = 'AddMemoryChangesToReports1779380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" ADD "memory_changes" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP COLUMN "memory_changes"`,
    );
  }
}
