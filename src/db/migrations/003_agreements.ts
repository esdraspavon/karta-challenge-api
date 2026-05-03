import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('agreements', (table) => {
    table.increments('id').primary();
    table
      .integer('card_program_id')
      .notNullable()
      .references('id')
      .inTable('card_programs')
      .onDelete('RESTRICT');
    table.string('code').notNullable();
    table.integer('version').notNullable();
    table.string('title').notNullable();
    table.string('pdf_url').notNullable();
    table.timestamp('published_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['card_program_id', 'code', 'version']);
    table.index(['card_program_id', 'code']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agreements');
}
