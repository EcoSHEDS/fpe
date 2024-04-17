
exports.up = async function (knex) {
  await knex.raw('DROP FUNCTION IF EXISTS f_station_values;')
  await knex.raw(`
  create or replace function f_station_values(_station_id int, _variable_id text, _start timestamp, _end timestamp)
  returns table (
      "timestamp" timestamptz,
      value real
  )
  as $$
      select
          v.timestamp,
          v.value
      from datasets d
      left join series s
      on d.id = s.dataset_id
      left join values v
      on s.id=v.series_id
      left join stations stn
      on stn.id=d.station_id
      where d.status='DONE'
          and d.station_id = _station_id
          and s.variable_id = _variable_id
          and v.timestamp at time zone stn.timezone >= _start
          and v.timestamp at time zone stn.timezone <= _end
      order by v.timestamp
  $$ language sql;
  `)
}

exports.down = async function (knex) {
  await knex.raw('DROP FUNCTION f_station_values;')
  await knex.raw(`
    create or replace function f_station_values(_station_id int, _variable_id text, _start timestamp, _end timestamp)
    returns table (
        "timestamp" timestamptz,
        value real
    )
    as $$
      select
          v.timestamp,
          v.value
      from datasets d
      left join series s
      on d.id = s.dataset_id
      left join values v
      on s.id=v.series_id
      where d.status='DONE'
          and d.station_id = _station_id
          and s.variable_id = _variable_id
          and v.timestamp >= _start
          and v.timestamp <= _end
      order by v.timestamp
    $$ language sql;
  `)
}
