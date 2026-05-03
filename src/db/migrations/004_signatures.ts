import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('signatures', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('agreement_id')
      .notNullable()
      .references('id')
      .inTable('agreements')
      .onDelete('RESTRICT');
    table.string('pdf_url_snapshot').notNullable();
    table.timestamp('signed_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'agreement_id']);
    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('signatures');
}
