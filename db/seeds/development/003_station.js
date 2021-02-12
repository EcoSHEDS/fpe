
exports.seed = knex => knex('stations').del()
  .then(() => knex.table('users')
    .first()
    .where({ email: 'jeff@walkerenvres.com' })
  )
  .then((user) => knex('stations').insert([
    {
      user_id: user.id,
      name: 'Station 001',
      latitude: '43.938880',
      longitude: '-70.049490'
    }
  ]))
