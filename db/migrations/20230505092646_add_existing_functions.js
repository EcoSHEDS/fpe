
exports.up = async function (knex) {
  await knex.raw(`
    -- daily values for station and variable
    create or replace function f_station_daily_values(_station_id INT)
        returns table (
            date DATE,
            variable_id TEXT,
            min REAL,
            mean REAL,
            max REAL,
            count REAL
        )
        as $$
            with tv as (
                select
                    s.timezone,
                    ss.id as series_id,
                    ss.variable_id,
                    (v.timestamp at time zone s.timezone)::date as date,
                    v.value
                from stations s
                inner join datasets d
                on s.id=d.station_id
                inner join series ss
                on d.id=ss.dataset_id
                inner join values v
                on ss.id=v.series_id
                where s.id=_station_id
                    and v.flag is null
                    and d.status='DONE'
                order by v.timestamp
            )
            select
                tv.date,
                tv.variable_id,
                min(tv.value)::REAL as min,
                avg(tv.value)::REAL as mean,
                max(tv.value)::REAL as max,
                count(tv.value)::REAL as count
            from tv
            group by tv.date, tv.variable_id
            order by tv.date, tv.variable_id
        $$ language sql;

    -- daily values as json
    create or replace function f_station_daily_values_json(_station_id INT)
        returns table(
            date DATE,
            "values" JSON
        )
        as $$
            with t_values as (
                select
                    date,
                    variable_id,
                    json_build_object('min', min, 'mean', mean, 'max', max, 'count', count) as json
                from f_station_daily_values(_station_id)
            )
            select date, json_object_agg(variable_id, json) as values
            from t_values
            group by date
        $$ language sql;

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

    -- get daily images and values
    create or replace function f_station_daily(_station_id int)
        returns table (
            date TEXT,
            image JSON,
            "values" JSON
        )
            as $$
                select to_char(coalesce(i.date, v.date), 'YYYY-MM-DD') as date, i.image, v.values
                from (select * from f_station_daily_images(_station_id)) i
                full outer join (select * from f_station_daily_values_json(_station_id)) v
                on i.date=v.date
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

    -- get all data values for station and variable within timestamp range
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

    -- station summary values
    create or replace function f_station_summary_values(_station_id int)
        returns table (
            variable_id text,
            start_date text,
            end_date text,
            count real
        )
        as $$
        with t_series as (
            select
                ds.variable_id,
                (d.start_timestamp at time zone s.timezone)::date as start_date,
                (d.end_timestamp at time zone s.timezone)::date as end_date,
                d.n_rows
            from stations s
            inner join datasets d
            on s.id=d.station_id
            inner join series ds
            on d.id=ds.dataset_id
            where s.id=_station_id
                and d.status='DONE'
        )
        select
            variable_id,
            to_char(min(start_date), 'yyyy-mm-dd') as start_date,
            to_char(max(end_date), 'yyyy-mm-dd') as end_date,
            sum(n_rows)::real as count
        from t_series
        group by variable_id
        $$ language sql;

    -- station summary images
    create or replace function f_station_summary_images(_station_id int)
        returns table (
            start_date text,
            end_date text,
            count real
        )
        as $$
        select
            to_char(min((ims.start_timestamp at time zone s.timezone)::date), 'yyyy-mm-dd') as start_date,
            to_char(max((ims.end_timestamp at time zone s.timezone)::date), 'yyyy-mm-dd') as end_date,
            coalesce(sum(ims.n_images), 0)::real as count
        from stations s
        inner join imagesets ims
        on s.id=ims.station_id
        where ims.status='DONE'
            and s.id=_station_id
        $$ language sql;

    -- station summary (counts, start/end)
    create or replace function f_station_summary(_station_id int)
        returns table (
            "values" JSON,
            images JSON
        )
        as $$
        with t_values as (
            select json_build_object(
                'start_date', min(start_date),
                'end_date', max(end_date),
                'count', coalesce(sum(count), 0),
                'variables', coalesce(json_agg(v), '[]'::json)
            ) as values
            from f_station_summary_values(_station_id) v
        ), t_images as (
            select row_to_json(i) as images from f_station_summary_images(_station_id) i
        )
        select * from t_values, t_images;
        $$ language sql;

    -- stations summary (all)
    create or replace function f_stations_summary()
        returns table (
            station_id INT,
            "values" JSON,
            images JSON
        )
        as $$
            with t_values as (
                select
                    s.id as station_id,
                    json_agg(distinct ss.variable_id) as variables,
                    sum(d.n_rows) as n_rows,
                    min((d.start_timestamp at time zone s.timezone)::date) as start_date,
                    max((d.start_timestamp at time zone s.timezone)::date) as end_date
                from stations s
                left join datasets d
                on s.id=d.station_id
                left join series ss
                on d.id=ss.dataset_id
                where d.status='DONE'
                group by s.id
            ), t_values_json as (
                select
                    v.station_id,
                    json_build_object('n_rows', v.n_rows, 'start_date', v.start_date, 'end_date', v.end_date, 'variables', v.variables) as values
                from t_values v
            ), t_images as (
                select
                    s.id as station_id,
                    sum(ims.n_images) as n_images,
                    min((ims.start_timestamp at time zone s.timezone)::date) as start_date,
                    max((ims.end_timestamp at time zone s.timezone)::date) as end_date
                from stations s
                left join imagesets ims
                on s.id=ims.station_id
                where ims.status='DONE'
                group by s.id
            ), t_images_json as (
                select
                    i.station_id,
                    json_build_object('n_images', i.n_images, 'start_date', i.start_date, 'end_date', i.end_date) as images
                from t_images i
            )
            select coalesce(v.station_id, i.station_id), v.values, i.images
            from t_values_json v
            full outer join t_images_json i
            on v.station_id=i.station_id
        $$ language sql;


    -- views
    create or replace view stations_summary_values as (
        with t_series as (
            select
                s.id as station_id,
                ds.variable_id,
                (d.start_timestamp at time zone s.timezone)::date as start_date,
                (d.end_timestamp at time zone s.timezone)::date as end_date,
                d.n_rows
            from stations s
            inner join datasets d
            on s.id=d.station_id
            inner join series ds
            on d.id=ds.dataset_id
            where d.status='DONE'
        )
        select
            station_id,
            variable_id,
            to_char(min(start_date), 'yyyy-mm-dd') as start_date,
            to_char(max(end_date), 'yyyy-mm-dd') as end_date,
            sum(n_rows)::real as count
        from t_series
        group by station_id, variable_id
    );
    create or replace view stations_summary_variables as (
        with t as (
            select
                s.id as station_id,
                coalesce(json_agg(distinct ds.variable_id), '[]'::json) as variables
            from stations s
            inner join datasets d
            on s.id=d.station_id
            inner join series ds
            on d.id=ds.dataset_id
            where d.status='DONE'
            group by s.id
        )
        select s.id as station_id, coalesce(t.variables, '[]'::json) as variables
        from stations s
        left join t on s.id=t.station_id
    );
    create or replace view stations_summary_images as (
        with t as (
            select
                s.id as station_id,
                to_char(min((ims.start_timestamp at time zone s.timezone)::date), 'yyyy-mm-dd') as start_date,
                to_char(max((ims.end_timestamp at time zone s.timezone)::date), 'yyyy-mm-dd') as end_date,
                coalesce(sum(ims.n_images), 0)::real as count
            from stations s
            inner join imagesets ims
            on s.id=ims.station_id
            where ims.status='DONE'
            group by s.id
        ), t_json as (
            select
                station_id,
                json_build_object('start_date', start_date, 'end_date', end_date, 'count', count) as images
            from t
        )
        select s.id as station_id, coalesce(t_json.images, '{ "count": 0 }'::json) as images
        from stations s
        left join t_json on s.id=t_json.station_id
    );

    -- daily values for station and variable
    create or replace function f_station_daily_values_variable(_station_id INT, _variable_id TEXT, _start DATE, _end DATE)
    returns table (
        date DATE,
        min REAL,
        mean REAL,
        max REAL,
        count REAL
    )
    as $$
        with tv as (
            select
                s.timezone,
                ss.id as series_id,
                (v.timestamp at time zone s.timezone)::date as date,
                v.value
            from stations s
            inner join datasets d
            on s.id=d.station_id
            inner join series ss
            on d.id=ss.dataset_id
            inner join values v
            on ss.id=v.series_id
            where s.id=_station_id
                and v.flag is null
                and d.status='DONE'
                and ss.variable_id=_variable_id
            order by v.timestamp
        )
        select
            tv.date,
            min(tv.value)::REAL as min,
            avg(tv.value)::REAL as mean,
            max(tv.value)::REAL as max,
            count(tv.value)::REAL as count
        from tv
        where tv.date >= _start
            and tv.date <= _end
        group by tv.date
        order by tv.date
    $$ language sql;
  `)
}

exports.down = async function (knex) {
  await knex.raw(`
    drop function f_station_daily_values;
    drop function f_station_daily_values_json;
    drop function f_station_daily_images;
    drop function f_station_daily;
    drop function f_station_images;
    drop function f_station_values;
    drop function f_station_summary;
    drop function f_station_summary_values;
    drop function f_station_summary_images;
    drop function f_stations_summary;
    drop function f_station_daily_values_variable;
    drop view stations_summary_values;
    drop view stations_summary_variables;
    drop view stations_summary_images;
  `)
}
