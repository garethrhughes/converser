import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemoryInstructionsToAgents1779370000000 implements MigrationInterface {
  name = 'AddMemoryInstructionsToAgents1779370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agents" ADD "memory_instructions" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agents" DROP COLUMN "memory_instructions"`,
    );
  }
}
