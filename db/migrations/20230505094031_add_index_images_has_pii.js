
exports.up = async function (knex) {
  await knex.raw(`
    CREATE INDEX images_has_pii_index
    ON images
    USING btree (image_has_pii(pii_person, pii_vehicle, pii_on, pii_off));
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
    DROP INDEX images_has_pii_index;
  `)
}
