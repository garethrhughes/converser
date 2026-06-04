import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFirefliesApiKeyToUsers1779390000000 implements MigrationInterface {
  name = 'AddFirefliesApiKeyToUsers1779390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fireflies_api_key_enc" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "fireflies_api_key_enc"`,
    );
  }
}
