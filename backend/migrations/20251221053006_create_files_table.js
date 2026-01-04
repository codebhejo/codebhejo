export function up(knex) {
  return knex.schema.createTable("files", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("(UUID())"));
    table.bigInteger("user_id").notNullable();
    table.string("filename", 255).notNullable();
    
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("files");
}
