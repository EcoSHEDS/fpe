const express = require('express')
const asyncHandler = require('express-async-handler')

const {
  attachAdminUser,
  // addUserToGroup,
  // removeUserFromGroup,
  // disableUser,
  // enableUser,
  getUsers,
  getUser,
  putUser
  // listUsersInGroup,
  // signUserOut
} = require('../../controllers/admin/users')

var router = express.Router()

router.route('/')
  .get(asyncHandler(getUsers))

router.route('/:userId')
  .all(asyncHandler(attachAdminUser))
  .get(asyncHandler(getUser))
  .put(asyncHandler(putUser))

// router.post('/addUserToGroup', async (req, res, next) => {
//   if (!req.body.username || !req.body.groupname) {
//     return next(createError(400, 'username and groupname are required'))
//   }

//   const response = await addUserToGroup(req.body.username, req.body.groupname)
//   res.status(200).json(response)
// })

// router.post('/removeUserFromGroup', async (req, res, next) => {
//   if (!req.body.username || !req.body.groupname) {
//     return next(createError(400, 'username and groupname are required'))
//   }

//   const response = await removeUserFromGroup(req.body.username, req.body.groupname)
//   res.status(200).json(response)
// })

// router.post('/disableUser', async (req, res, next) => {
//   if (!req.body.username) {
//     return next(createError(400, 'username is required'))
//   }

//   const response = await disableUser(req.body.username)
//   res.status(200).json(response)
// })

// router.post('/enableUser', async (req, res, next) => {
//   if (!req.body.username) {
//     return next(createError(400, 'username is required'))
//   }

//   const response = await enableUser(req.body.username)
//   res.status(200).json(response)
// })

// router.route('/:stationId')
//   .all(asyncHandler(attachStation))
//   .get(asyncHandler(getStation))

// router.get('/users', async (req, res, next) => {
//   const users = await listUsers()
//   res.status(200).json(users)
// })

// router.get('/getUser', async (req, res, next) => {
//   if (!req.query.username) {
//     return next(createError(400, 'username is required'))
//   }

//   const response = await getUser(req.query.username)
//   res.status(200).json(response)
// })

// router.get('/listGroups', async (req, res, next) => {
//   try {
//     let response
//     if (req.query.token) {
//       response = await listGroups(req.query.limit || 25, req.query.token)
//     } else if (req.query.limit) {
//       response = await listGroups((Limit = req.query.limit))
//     } else {
//       response = await listGroups()
//     }
//     res.status(200).json(response)
//   } catch (err) {
//     next(err)
//   }
// })

// router.get('/listGroupsForUser', async (req, res, next) => {
//   if (!req.query.username) {
//     const err = new Error('username is required')
//     err.statusCode = 400
//     return next(err)
//   }

//   try {
//     let response
//     if (req.query.token) {
//       response = await listGroupsForUser(req.query.username, req.query.limit || 25, req.query.token)
//     } else if (req.query.limit) {
//       response = await listGroupsForUser(req.query.username, (Limit = req.query.limit))
//     } else {
//       response = await listGroupsForUser(req.query.username)
//     }
//     res.status(200).json(response)
//   } catch (err) {
//     next(err)
//   }
// })

// router.get('/listUsersInGroup', async (req, res, next) => {
//   if (!req.query.groupname) {
//     const err = new Error('groupname is required')
//     err.statusCode = 400
//     return next(err)
//   }

//   try {
//     let response
//     if (req.query.token) {
//       response = await listUsersInGroup(req.query.groupname, req.query.limit || 25, req.query.token)
//     } else if (req.query.limit) {
//       response = await listUsersInGroup(req.query.groupname, (Limit = req.query.limit))
//     } else {
//       response = await listUsersInGroup(req.query.groupname)
//     }
//     res.status(200).json(response)
//   } catch (err) {
//     next(err)
//   }
// })

// router.post('/signUserOut', async (req, res, next) => {
//   /**
//    * To prevent rogue actions of users with escalated privilege signing
//    * other users out, we ensure it's the same user making the call
//    * Note that this only impacts actions the user can do in User Pools
//    * such as updating an attribute, not services consuming the JWT
//    */
//   if (
//     req.body.username != req.apiGateway.event.requestContext.authorizer.claims.username &&
//     req.body.username != /[^/]*$/.exec(req.apiGateway.event.requestContext.identity.userArn)[0]
//   ) {
//     const err = new Error('only the user can sign themselves out')
//     err.statusCode = 400
//     return next(err)
//   }

//   try {
//     const response = await signUserOut(req.body.username)
//     res.status(200).json(response)
//   } catch (err) {
//     next(err)
//   }
// })

module.exports = router
