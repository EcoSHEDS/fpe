
exports.up = async function (knex) {
  await knex.raw('DROP FUNCTION IF EXISTS f_station_random_image_pairs;')
  await knex.raw(`
    create or replace function f_station_random_image_pairs(_station_id int, _n_pairs int, _min_hour int, _max_hour int)
    returns table (
      left json,
      right json
    )
    as $$
      with t as (
        select i.id as image_id, i.filename, i.timestamp, i.thumb_url
        from imagesets ii
        left join images i on ii.id=i.imageset_id
        left join stations s on ii.station_id=s.id
        where ii.station_id=_station_id
          and ii.status='DONE'
          and date_part('hour', i.timestamp at time zone s.timezone) between _min_hour and _max_hour
          and not image_has_pii(i.pii_person, i.pii_vehicle, i.pii_on, i.pii_off)
      )
      select row_to_json(t1.*) as left, row_to_json(t2.*) as right
      from (select *, row_number() over (order by random()) as i from t) t1
      inner join (select *, row_number() over (order by random()) as i from t) t2 on t1.i = t2.i
      where t1.image_id <> t2.image_id
      limit _n_pairs
    $$ language sql;
  `)
}

exports.down = async function (knex) {
  await knex.raw('DROP FUNCTION f_station_random_image_pairs;')
  await knex.raw(`
    create or replace function f_station_random_image_pairs(_station_id int, _n_pairs int)
    returns table (
      left json,
      right json
    )
    as $$
      with t as (
        select i.id as image_id, i.filename, i.timestamp, i.thumb_url
        from imagesets ii
        left join images i on ii.id=i.imageset_id
        left join stations s on ii.station_id=s.id
        where ii.station_id=_station_id
          and ii.status='DONE'
          and not image_has_pii(i.pii_person, i.pii_vehicle, i.pii_on, i.pii_off)
      )
      select row_to_json(t1.*) as left, row_to_json(t2.*) as right
      from (select *, row_number() over (order by random()) as i from t) t1
      inner join (select *, row_number() over (order by random()) as i from t) t2 on t1.i = t2.i
      where t1.image_id <> t2.image_id
      limit _n_pairs
    $$ language sql;
  `)
}
