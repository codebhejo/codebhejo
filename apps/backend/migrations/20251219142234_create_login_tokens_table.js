export function up(knex) {
  return knex.schema.createTable("login_tokens", (table) => {
    table.bigIncrements("id").primary();
    table
      .bigInteger("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.string("token_hash", 64).notNullable().index();
    table.boolean("used").defaultTo(false);
    table.dateTime("expires_at").notNullable();
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("login_tokens");
}
