const { CognitoIdentityServiceProvider } = require('aws-sdk')
const createError = require('http-errors')

const { User } = require('../../db/models')

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: process.env.REGION
})
const userPoolId = process.env.USERPOOL_ID

async function attachAdminUser (req, res, next) {
  const user = await fetchUser(req.params.userId)
  if (!user) throw createError(404, `User (${req.params.userId}) not found`)
  const groups = await listGroupsForUser(user.Username)
  res.locals.adminUser = {
    id: user.Username,
    attributes: transformUserAttributes(user.UserAttributes),
    created_at: user.UserCreateDate,
    updated_at: user.UserLastModifiedDate,
    enabled: user.Enabled,
    status: user.UserStatus,
    is_admin: groups.includes('admins')
  }
  return next()
}

async function createCognitoUser (email, name, resend) {
  const params = {
    UserPoolId: userPoolId,
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      {
        Name: 'name',
        Value: name
      },
      {
        Name: 'email',
        Value: email
      },
      {
        Name: 'email_verified',
        Value: 'true'
      }
    ]
  }
  if (resend) {
    params.MessageAction = 'RESEND'
  }
  const response = await cognitoIdentityServiceProvider.adminCreateUser(params).promise()
  return response.User
}

async function createDatabaseUser (user) {
  return await User.query().insert(user).returning('*')
}

async function setAffiliation (id, affiliation) {
  console.log(`setAffiliation(id=${id})`)
  const existing = await User.query().findById(id)
  if (existing) {
    return await User.query()
      .patchAndFetchById(id, {
        affiliation_name: affiliation.name,
        affiliation_code: affiliation.code
      })
  } else {
    return await User.query().insert({
      id,
      affiliation_name: affiliation.name,
      affiliation_code: affiliation.code
    }).returning('*')
  }
}

async function setTrainingRequired (id, training_required) {
  return await User.query().patchAndFetchById(id, { training_required })
}

async function setTrainingComplete (id, training_complete) {
  return await User.query().patchAndFetchById(id, { training_complete })
}

async function setAnnotatorOnly (id, annotator_only) {
  console.log('setAnnotatorOnly', id, annotator_only)
  return await User.query().patchAndFetchById(id, { annotator_only })
}

async function resendPassword (user) {
  const email = user.attributes.email
  const name = user.attributes.name

  await createCognitoUser(email, name, true)
  // console.log({email, name})

  return {
    message: 'Temporary password resent to user'
  }
}

async function deleteCognitoUser (id) {
  console.log(`deleteUser (${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminDeleteUser(params).promise()
  return {
    message: `User (${id}) has been deleted`
  }
}

async function deleteUser (req, res, next) {
  await deleteCognitoUser(res.locals.adminUser.id)
  return res.status(204).json()
}

async function postUsers (req, res, next) {
  const { email, name, affiliation, admin, training_required, annotator_only } = req.body

  const cognitoUser = await createCognitoUser(email, name)
  if (admin) {
    await addUserToGroup(cognitoUser.Username, 'admins')
  }

  const dbUser = await createDatabaseUser({
    id: cognitoUser.Username,
    affiliation_name: affiliation.name,
    affiliation_code: affiliation.code,
    training_required: training_required,
    training_complete: false,
    annotator_only: annotator_only
  })

  return res.status(201).json({
    ...cognitoUser,
    affiliation: dbUser.affiliation,
    training_required: dbUser.training_required,
    training_complete: dbUser.training_complete,
    annotator_only: dbUser.annotator_only
  })
}

async function addUserToGroup (id, groupname) {
  console.log(`addUserToGroup (${id}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise()
  return {
    message: `User (${id}) added to group (${groupname})`
  }
}

async function removeUserFromGroup (id, groupname) {
  console.log(`removeUserFromGroup (${id}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminRemoveUserFromGroup(params).promise()
  return {
    message: `User (${id}) removed from group (${groupname})`
  }
}

async function disableUser (id) {
  console.log(`disableUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminDisableUser(params).promise()
  return {
    message: `User (${id}) disabled`
  }
}

async function enableUser (id) {
  console.log(`enableUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminEnableUser(params).promise()
  return {
    message: `User (${id}) enabled`
  }
}

function transformUserAttributes (attributes) {
  const transformed = {}
  attributes.forEach(a => {
    transformed[a.Name] = a.Value
  })
  return transformed
}

async function listUsers (users, token, iter) {
  users = users || []
  iter = iter || 0
  console.log(`listUsers(iter=${iter})`)

  const params = {
    UserPoolId: userPoolId,
    PaginationToken: token || null
  }

  const result = await cognitoIdentityServiceProvider.listUsers(params).promise()
  users = [...(users || []), ...result.Users]
  if (result.PaginationToken) {
    return await listUsers(users, result.PaginationToken, iter + 1)
  }

  const adminUsers = await listUsersInGroup('admins')
  const adminUserIds = adminUsers.map(d => d.Username)

  return users.map(d => ({
    id: d.Username,
    attributes: transformUserAttributes(d.Attributes),
    created_at: d.UserCreateDate,
    updated_at: d.UserLastModifiedDate,
    enabled: d.Enabled,
    status: d.UserStatus,
    is_admin: adminUserIds.includes(d.Username)
  }))
}

async function listUsersInGroup (groupname, users, token, iter) {
  users = users || []
  iter = iter || 0
  console.log(`listUsersInGroup(groupname=${groupname},iter=${iter})`)

  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    NextToken: token || null
  }

  const result = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise()

  users = [...(users || []), ...result.Users]

  if (result.NextToken) {
    return await listUsers(groupname, [...users, ...result.Users], result.NextToken)
  }

  return users
}

async function listGroupsForUser (id) {
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  const result = await cognitoIdentityServiceProvider.adminListGroupsForUser(params).promise()
  return result.Groups.map(d => d.GroupName)
}

async function getUsers (req, res, next) {
  let users = []
  try {
    const cognitoUsers = await listUsers()
    const dbUsers = await User.query()

    users = cognitoUsers.map(cognitoUser => {
      const dbUser = dbUsers.find(u => u.id === cognitoUser.id)
      return {
        ...cognitoUser,
        training_required: dbUser ? dbUser.training_required : null,
        training_complete: dbUser ? dbUser.training_complete : null,
        annotator_only: dbUser ? dbUser.annotator_only : null
      }
    })
  } catch (err) {
    console.log(err)
    return next(createError(500, 'Failed to list users'))
  }

  res.status(200).json(users)
}

async function fetchUser (id) {
  // console.log(`fetchUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }
  try {
    return await cognitoIdentityServiceProvider.adminGetUser(params).promise()
  } catch (err) {
    if (err.code && err.code === 'UserNotFoundException') {
      console.log(`user (${id}) not found`)
      return null
    }
    console.log(err)
    throw createError(500, 'Failed to get user')
  }
}

async function getUser (req, res, next) {
  const dbUser = await User.query().findById(res.locals.adminUser.id)
  res.status(200).json({ ...dbUser, ...res.locals.adminUser })
}

async function putUser (req, res, next) {  console.log(req.body)
  let response
  if (req.body.action === 'enable') {
    response = await enableUser(res.locals.adminUser.id)
  } else if (req.body.action === 'disable') {
    response = await disableUser(res.locals.adminUser.id)
  } else if (req.body.action === 'addToAdmin') {
    response = await addUserToGroup(res.locals.adminUser.id, 'admins')
  } else if (req.body.action === 'removeFromAdmin') {
    response = await removeUserFromGroup(res.locals.adminUser.id, 'admins')
  } else if (req.body.action === 'setAffiliation') {
    response = await setAffiliation(res.locals.adminUser.id, req.body.payload.affiliation)
  } else if (req.body.action === 'setTrainingRequired') {
    response = await setTrainingRequired(res.locals.adminUser.id, req.body.value)
  } else if (req.body.action === 'setTrainingComplete') {
    response = await setTrainingComplete(res.locals.adminUser.id, req.body.value)
  } else if (req.body.action === 'setAnnotatorOnly') {
    response = await setAnnotatorOnly(res.locals.adminUser.id, req.body.value)
  } else if (req.body.action === 'signOut') {
    response = await signOutUser(res.locals.adminUser.id)
  } else if (req.body.action === 'resetPassword') {
    response = await resetPassword(res.locals.adminUser.id)
  } else if (req.body.action === 'resendPassword') {
    response = await resendPassword(res.locals.adminUser)
  } else {
    throw createError(400, 'Invalid user action')
  }
  return res.status(200).json(response)
}

async function resetPassword (id) {
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminResetUserPassword(params).promise()
  return {
    message: `User (${id}) password has been reset`
  }
}

async function signOutUser (id) {
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminUserGlobalSignOut(params).promise()
  return {
    message: `User (${id}) signed out from all devices`
  }
}

module.exports = {
  attachAdminUser,
  getUsers,
  postUsers,
  fetchUser,
  transformUserAttributes,
  getUser,
  putUser,
  deleteUser
}
