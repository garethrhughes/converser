import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1779336872072 implements MigrationInterface {
  name = 'CreateUsersTable1779336872072';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "google_id" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "picture" character varying, "hashed_refresh_token" character varying, "google_access_token_enc" text, "google_refresh_token_enc" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
