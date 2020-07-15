
exports.seed = knex => knex('variables').del()
  .then(() => knex('users').insert([
    {
      email: 'jeff@walkerenvres.com',
      fullname: 'Jeff Walker',
      password: 'sheds'
    }
  ]))
