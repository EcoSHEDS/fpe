
exports.up = async function (knex) {
  await knex.raw(`
    -- get daily images (mid-day) for station
    create or replace function f_station_daily_images(_station_id INT)
        returns table (
            date DATE,
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
                    and not image_has_pii(pii_person, pii_vehicle, pii_on, pii_off)
                order by i.timestamp
            ), t_images_rank as (
                select *, row_number() over(partition by i.date order by i.hours_from_noon, i.timestamp) as rank
                from t_images i
            ), t_images_rank_avg as (
                select i.*, i2.avg_rank
                from t_images_rank i
                join (select date, ceil(avg(rank)) as avg_rank from t_images_rank group by date) i2
                on i.date=i2.date
            )
            select i.date, json_build_object('id', i.id, 'timestamp', i.timestamp, 'filename', i.filename, 'thumb_url', i.thumb_url) as image
            from t_images_rank_avg i
            where i.rank=1
            order by date
        $$ language sql;

    -- get all valid images for station within timestamp range
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
                and not image_has_pii(pii_person, pii_vehicle, pii_on, pii_off)
            order by i.timestamp
        $$ language sql;
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
      -- get daily images (mid-day) for station
      create or replace function f_station_daily_images(_station_id INT)
          returns table (
              date DATE,
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
                  select i.*, i2.avg_rank
                  from t_images_rank i
                  join (select date, ceil(avg(rank)) as avg_rank from t_images_rank group by date) i2
                  on i.date=i2.date
              )
              select i.date, json_build_object('id', i.id, 'timestamp', i.timestamp, 'filename', i.filename, 'thumb_url', i.thumb_url) as image
              from t_images_rank_avg i
              where i.rank=1
              order by date
          $$ language sql;

      -- get all valid images for station within timestamp range
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
