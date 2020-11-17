
exports.seed = knex => knex('cameras').del()
  .then(() => knex.table('users').first().where({ email: 'jeff@walkerenvres.com' }))
  .then((user) => knex('cameras').insert([
    {
      user_id: user.id,
      name: 'Camera 001',
      make: 'Bushnell Core',
      serial: 'XYZ123456789'
    }
  ]))
