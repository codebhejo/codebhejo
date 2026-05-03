export function up(knex) {
  return knex.schema.alterTable("login_tokens", (table) => {
    table.string("email", 255).nullable();
    table.bigInteger("user_id").unsigned().nullable().alter();
  });
}

export function down(knex) {
  return knex.schema.alterTable("login_tokens", (table) => {
    table.dropColumn("email");
    table.bigInteger("user_id").unsigned().notNullable().alter();
  });
}
