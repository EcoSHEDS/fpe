-- get daily dataset for station (image, flow/stage stats)
create or replace function f_station_daily(_station_id int)
returns table (
	date DATE,
	image JSON,
	data JSON
)
as $$
with t_series as (
	select
	  d.station_id,
	  d.id as dataset_id,
	  d.uuid,
	  d.status,
	  s.id as series_id,
	  s.variable_id
	from datasets d
	left join series s
	on d.id=s.dataset_id
	where
	  d.status='DONE' and
	  d.station_id=_station_id
), t_values as (
	select
		s.variable_id,
		v.date,
		min(v.value) as min,
		avg(v.value) as mean,
		max(v.value) as max,
		count(v.value) as count
	from t_series s
	left join values v
	on s.series_id=v.series_id
	where v.flag is null
	group by s.variable_id, v.date
), t_values_json_variables as (
	select
	  v.date,
	  v.variable_id,
	  json_build_object('min', min, 'mean', mean, 'max', max, 'count', count) as json
	  -- json_build_array(min, mean, max, count) as json
	from t_values v
), t_values_json as (
	select date, json_object_agg(variable_id, json) as data
	from t_values_json_variables
	group by date
), t_images as (
	select
		i.date,
		i.id,
		i.filename,
		i.timestamp,
		i.thumb_url,
		rank() over(partition by i.date order by i.timestamp) as rank
	from imagesets s
	left join images i
	on s.id=i.imageset_id
	where s.status='DONE' and i.status='DONE' and s.station_id=_station_id
	order by i.timestamp
), t_images_rank as (
	select i.*, i2.avg_rank
	from t_images i
	join (select date, ceil(avg(rank)) as avg_rank from t_images group by date) i2
	on i.date=i2.date
), t_images_daily as (
	select date, id, filename, timestamp, thumb_url
	from t_images_rank i
	where rank=avg_rank
), t_images_json as (
	select
	  date,
	  json_build_object('id', id, 'filename', filename, 'timestamp', timestamp, 'thumb_url', thumb_url) as image
	from t_images_daily
)
select i.date, i.image, v.data
  from t_images_json i
  full outer join t_values_json v
  on i.date=v.date
$$ language sql;

-- get all valid images for station within timestamp range
create or replace function f_station_images(_station_id int, _start timestamp, _end timestamp)
returns table (
    id int,
    filename text,
    date text,
    "timestamp" timestamptz,
    thumb_url text
)
as $$
	select
		i.id,
		i.filename,
		i.date::text,
		i.timestamp,
		i.thumb_url
	from imagesets s
	left join images i
	on s.id=i.imageset_id
	where s.status='DONE'
		and i.status='DONE'
		and s.station_id = _station_id
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
