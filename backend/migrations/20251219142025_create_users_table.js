export function up(knex) {
  return knex.schema.createTable("users", table => {
    table.bigIncrements("id").primary();
    table.string("email", 255).notNullable().unique();
    table.timestamps(true, true);
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("users");
}
