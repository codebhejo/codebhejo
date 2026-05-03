export function up(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.boolean("is_admin").notNullable().defaultTo(false);
    table.dateTime("last_login_at").nullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("is_admin");
    table.dropColumn("last_login_at");
  });
}
