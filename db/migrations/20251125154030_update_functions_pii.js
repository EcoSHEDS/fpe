// use image_has_pii() to filter images instead of hard coding thresholds

exports.up = async function(knex) {
  console.log('replace function f_station_daily_images')
  await knex.raw(`
    create or replace function f_station_daily_images(_station_id INT)
    returns table (
        date DATE,
        n_images BIGINT,
        image JSON
    )
    as $$
      with t_images as (
        select
            i.id,
            i.filename,
            i.timestamp,
            i.thumb_url,
            (i.timestamp at time zone s.timezone)::date as date,
            abs(date_part('hour', i.timestamp at time zone s.timezone) - 12) as hours_from_noon
        from stations s
        inner join imagesets ss
        on s.id=ss.station_id
        inner join images i
        on ss.id=i.imageset_id
        where s.id=_station_id
            and ss.status='DONE'
            and i.status='DONE'
            and not image_has_pii(i.pii_person, i.pii_vehicle, i.pii_on, i.pii_off)
        order by i.timestamp
      ), t_images_rank as (
          select *, row_number() over(partition by i.date order by i.hours_from_noon, i.timestamp) as rank
          from t_images i
      ), t_images_rank_avg as (
          select i.*, i2.avg_rank, i2.n_images
          from t_images_rank i
          join (select date, ceil(avg(rank)) as avg_rank, count(*) as n_images from t_images_rank group by date) i2
          on i.date=i2.date
      )
      select i.date, i.n_images, json_build_object('id', i.id, 'timestamp', i.timestamp, 'filename', i.filename, 'thumb_url', i.thumb_url) as image
      from t_images_rank_avg i
      where i.rank=1
      order by date
    $$ language sql;
  `)

  console.log('replace function f_station_images')
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
          and not image_has_pii(i.pii_person, i.pii_vehicle, i.pii_on, i.pii_off)
      order by i.timestamp
    $$ language sql;
  `)
};

exports.down = async function(knex) {
  console.log('revert function f_station_daily_images')
  await knex.raw(`
    create or replace function f_station_daily_images(_station_id INT)
    returns table (
        date DATE,
        n_images BIGINT,
        image JSON
    )
    as $$
      with t_images as (
        select
            i.id,
            i.filename,
            i.timestamp,
            i.thumb_url,
            (i.timestamp at time zone s.timezone)::date as date,
            abs(date_part('hour', i.timestamp at time zone s.timezone) - 12) as hours_from_noon
        from stations s
        inner join imagesets ss
        on s.id=ss.station_id
        inner join images i
        on ss.id=i.imageset_id
        where s.id=_station_id
            and ss.status='DONE'
            and i.status='DONE'
            and (
                i.pii_person < 0.8
                and i.pii_vehicle < 0.8
                and not i.pii_on
                or i.pii_off
            )
        order by i.timestamp
      ), t_images_rank as (
          select *, row_number() over(partition by i.date order by i.hours_from_noon, i.timestamp) as rank
          from t_images i
      ), t_images_rank_avg as (
          select i.*, i2.avg_rank, i2.n_images
          from t_images_rank i
          join (select date, ceil(avg(rank)) as avg_rank, count(*) as n_images from t_images_rank group by date) i2
          on i.date=i2.date
      )
      select i.date, i.n_images, json_build_object('id', i.id, 'timestamp', i.timestamp, 'filename', i.filename, 'thumb_url', i.thumb_url) as image
      from t_images_rank_avg i
      where i.rank=1
      order by date
    $$ language sql;
  `)

  console.log('revert function f_station_images')
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
};
