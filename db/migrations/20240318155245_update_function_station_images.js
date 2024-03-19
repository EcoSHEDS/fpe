
exports.up = async function (knex) {
  await knex.raw('DROP FUNCTION IF EXISTS f_station_images;')
  await knex.raw(`
    create or replace function f_station_images(_station_id int, _start timestamp, _end timestamp)
    returns table (
        id int,
        filename text,
        "timestamp" timestamptz,
        thumb_url text
    )
    as $$
      select
          i.id,
          i.filename,
          i.timestamp,
          i.thumb_url
      from imagesets s
      left join images i
      on s.id=i.imageset_id
      left join stations st
      on s.station_id=st.id
      where s.station_id = _station_id
          and s.status='DONE'
          and i.status='DONE'
          and (i.timestamp at time zone st.timezone) >= _start
          and (i.timestamp at time zone st.timezone) <= _end
          and (
              i.pii_person < 0.8
              and i.pii_vehicle < 0.8
              and not i.pii_on
              or i.pii_off
          )
      order by i.timestamp
    $$ language sql;
  `)
}

exports.down = async function (knex) {
  await knex.raw('DROP FUNCTION f_station_images;')
  await knex.raw(`
    create or replace function f_station_images(_station_id int, _start timestamp, _end timestamp)
    returns table (
        id int,
        filename text,
        "timestamp" timestamptz,
        thumb_url text
    )
    as $$
      select
          i.id,
          i.filename,
          i.timestamp,
          i.thumb_url
      from imagesets s
      left join images i
      on s.id=i.imageset_id
      where s.station_id = _station_id
          and s.status='DONE'
          and i.status='DONE'
          and i.timestamp >= _start
          and i.timestamp <= _end
          and (
              i.pii_person < 0.8
              and i.pii_vehicle < 0.8
              and not i.pii_on
              or i.pii_off
          )
      order by i.timestamp
    $$ language sql;
  `)
}
