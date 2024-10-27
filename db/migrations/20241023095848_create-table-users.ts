import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary()
        table.uuid('session_id').notNullable().unique().index()
        table.text('name').notNullable()
        table.text('email').notNullable().unique()
        table.text('avatar_url')
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('users')
}

