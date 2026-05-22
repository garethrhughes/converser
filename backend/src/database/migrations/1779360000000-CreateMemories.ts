import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMemories1779360000000 implements MigrationInterface {
  name = 'CreateMemories1779360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "memories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "person_id" uuid NOT NULL, "report_id" uuid, "content" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_memories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories" ADD CONSTRAINT "FK_memories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories" ADD CONSTRAINT "FK_memories_person_id" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories" ADD CONSTRAINT "FK_memories_report_id" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "memories" DROP CONSTRAINT "FK_memories_report_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories" DROP CONSTRAINT "FK_memories_person_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "memories" DROP CONSTRAINT "FK_memories_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "memories"`);
  }
}
