-- get daily values for station (all variables)
create or replace function f_station_daily_values(_station_id INT)
returns table (
	variable_id TEXT,
	date DATE,
	min REAL,
	mean REAL,
	max REAL,
	count BIGINT
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
		left join datasets d
		on s.id=d.station_id
		left join series ss
		on d.id=ss.dataset_id
		left join values v
		on ss.id=v.series_id
		where s.id=_station_id
		  and v.flag is null
		  and d.status='DONE'
		order by v.timestamp
	)
	select
		tv.variable_id,
		tv.date,
		min(tv.value)::REAL as min,
		avg(tv.value)::REAL as mean,
		max(tv.value)::REAL as max,
		count(tv.value) as count
	from tv
	group by tv.variable_id, tv.date
	order by tv.variable_id, tv.date
$$ language sql;

-- get daily images (mid-day) for station
create or replace function f_station_daily_images(_station_id INT)
returns table (
	date DATE,
	n_images BIGINT,
	id INT,
	"timestamp" TIMESTAMPTZ,
	filename TEXT,
	thumb_url TEXT
)
as $$
	with t_images as (
		select
			i.id,
			i.filename,
			i.timestamp,
			i.thumb_url,
			(i.timestamp at time zone s.timezone)::date as date
		from stations s
		left join imagesets ss
		on s.id=ss.station_id
		left join images i
		on ss.id=i.imageset_id
		where s.id=_station_id
		  and ss.status='DONE'
		  and i.status='DONE'
		order by i.timestamp
	), t_images_rank as (
		select *, rank() over(partition by i.date order by i.timestamp) as rank
		from t_images i
	), t_images_rank_avg as (
		select i.*, i2.avg_rank
		from t_images_rank i
		join (select date, ceil(avg(rank)) as avg_rank from t_images_rank group by date) i2
		on i.date=i2.date
	), t_images_count as (
		select i.date, count(*) as n_images
		from t_images i
		group by i.date
	)
	select i.date, n.n_images, i.id, i.timestamp, i.filename, i.thumb_url
	from t_images_rank_avg i
	left join t_images_count n
	on i.date=n.date
	where i.rank=i.avg_rank
$$ language sql;

-- get daily values and images for station
create or replace function f_station_daily(_station_id int)
returns table (
	date TEXT,
	images JSON,
	"values" JSON
)
as $$
	with t_values as (
		select
			date,
			variable_id,
			json_build_object('min', min, 'mean', mean, 'max', max, 'count', count) as json
		from f_station_daily_values(_station_id)
	), t_values_json as (
		select date, json_object_agg(variable_id, json) as values
		from t_values
		group by date
	), t_images as (
		select
			date,
			n_images,
			json_build_object('id', id, 'filename', filename, 'timestamp', timestamp, 'thumb_url', thumb_url) as image
		from f_station_daily_images(_station_id)
	), t_images_json as (
		select
			date,
			json_build_object('n_images', n_images, 'image', image) as images
		from t_images
	)
	select to_char(coalesce(i.date, v.date), 'YYYY-MM-DD') as date, i.images, v.values
	from t_images_json i
	full outer join t_values_json v
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

-- station summary (counts, start/end)
create or replace function f_station_summary(_station_id int)
returns table (
	"values" JSON,
	images JSON
)
as $$
	with t_values_daily as (
		select count(*) as n_days from f_station_daily_values(_station_id)
	), t_values as (
		select
			json_agg(distinct ss.variable_id) as variables,
		  	min(v.timestamp) as start,
		  	max(v.timestamp) as end
		from stations s
		left join datasets d
		on s.id=d.station_id
		left join series ss
		on d.id=ss.dataset_id
		left join values v
		on ss.id=v.series_id
		where s.id=_station_id
		  and v.flag is null
		  and d.status='DONE'
	), t_values_json as (
		select
			json_build_object('n_days', vd.n_days, 'start', v.start, 'end', v.end, 'variables', v.variables) as values
		from t_values_daily vd, t_values v
	), t_images as (
		select
			count(*) as n_images,
			min(i.timestamp) as start,
			max(i.timestamp) as end
		from stations s
		left join imagesets ss
		on s.id=ss.station_id
		left join images i
		on ss.id=i.imageset_id
		where s.id=_station_id
		  and ss.status='DONE'
		  and i.status='DONE'
	), t_images_json as (
		select
			json_build_object('n_images', i.n_images, 'start', i.start, 'end', i.end) as images
		from t_images i
	)
	select v.*, i.* from t_values_json v, t_images_json i
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
			count(distinct (v.timestamp at time zone s.timezone)::date) as n_days,
		  	min(v.timestamp) as start,
		  	max(v.timestamp) as end
		from stations s
		left join datasets d
		on s.id=d.station_id
		left join series ss
		on d.id=ss.dataset_id
		left join values v
		on ss.id=v.series_id
		where v.flag is null
		  and d.status='DONE'
		group by s.id
	), t_values_json as (
		select
			v.station_id,
			json_build_object('n_days', v.n_days, 'start', v.start, 'end', v.end, 'variables', v.variables) as values
		from t_values v
	), t_images as (
		select
			s.id as station_id,
			count(*) as n_images,
			min(i.timestamp) as start,
			max(i.timestamp) as end
		from stations s
		left join imagesets ss
		on s.id=ss.station_id
		left join images i
		on ss.id=i.imageset_id
		where ss.status='DONE'
		  and i.status='DONE'
		group by s.id
	), t_images_json as (
		select
			i.station_id,
			json_build_object('n_images', i.n_images, 'start', i.start, 'end', i.end) as images
		from t_images i
	)
	select coalesce(v.station_id, i.station_id), v.values, i.images
	from t_values_json v
	full outer join t_images_json i
	on v.station_id=i.station_id
$$ language sql;
