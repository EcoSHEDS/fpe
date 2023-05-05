
exports.up = async function (knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION image_has_pii(pii_person float, pii_vehicle float, pii_on boolean, pii_off boolean)
    RETURNS boolean AS $$
    BEGIN
      IF (pii_person >= 0.8 OR pii_vehicle >= 0.8 or pii_on) and not pii_off THEN
          RETURN TRUE;
      ELSE
          RETURN FALSE;
      END IF;
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
    DROP FUNCTION f_station_daily_values;
  `)
}
