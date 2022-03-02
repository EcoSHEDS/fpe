
exports.up = async function (knex) {
  await knex.schema.table('imagesets', t => {
    t.integer('n_images')
    t.timestamp('start_timestamp')
    t.timestamp('end_timestamp')
  })
  await knex.raw(`
    with i as (
      select
        imageset_id,
        count(*) as n_images,
        min(timestamp) as start_timestamp,
        max(timestamp) as end_timestamp
      from images i
      where status='DONE'
      group by imageset_id
    )
    update imagesets ims
    set n_images = i.n_images,
        start_timestamp = i.start_timestamp,
        end_timestamp = i.end_timestamp
    from i
    where ims.id=i.imageset_id
  `)
}

exports.down = knex => knex.schema.alterTable('imagesets', t => {
  t.dropColumn('n_images')
  t.dropColumn('start_timestamp')
  t.dropColumn('end_timestamp')
})
