export function up(knex) {
  return knex.schema.alterTable("files", (table) => {
    table.renameColumn("filename", "name");
    table.string("file_id", 8).notNullable().unique().after("id");
    table.unique(["user_id", "file_id"], "uniq_user_file_id");
  });
}

export function down(knex) {
    return knex.schema.alterTable("files", (table) => {
        table.dropColumn("file_id");
        table.renameColumn("name", "filename");
    });
}
