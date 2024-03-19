
exports.up = async function (knex) {
  console.log('drop function f_station_daily_images')
  await knex.raw('DROP FUNCTION IF EXISTS f_station_daily_images;')
  console.log('create function f_station_daily_images')
  await knex.raw(`
    create or replace function f_station_daily_images(_station_id INT)
    returns table (
        date DATE,
        n_images INT,
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
}

exports.down = async function (knex) {
  await knex.raw('DROP FUNCTION f_station_daily_images;')
  await knex.raw(`
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
  `)
}
