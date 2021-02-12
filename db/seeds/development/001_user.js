
exports.seed = knex => knex('users').del()
  .then(() => knex('users').insert([
    {
      email: 'jeff@walkerenvres.com',
      fullname: 'Jeff Walker',
      password: 'sheds-fpe'
    }
  ]))
