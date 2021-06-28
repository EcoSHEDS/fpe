const { CognitoIdentityServiceProvider } = require('aws-sdk')
const createError = require('http-errors')

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: process.env.REGION
})
const userPoolId = process.env.USERPOOL_ID

async function attachAdminUser (req, res, next) {
  const user = await fetchUser(req.params.userId)
  if (!user) throw createError(404, `User (${req.params.userId}) not found`)
  const groups = await listGroupsForUser(user.Username)
  res.locals.adminUser = {
    username: user.Username,
    attributes: transformUserAttributes(user.UserAttributes),
    created_at: user.UserCreateDate,
    updated_at: user.UserLastModifiedDate,
    enabled: user.Enabled,
    status: user.UserStatus,
    is_admin: groups.includes('admins')
  }
  return next()
}

async function addUserToGroup (username, groupname) {
  console.log(`addUserToGroup (${username}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: username
  }

  await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise()
  return {
    message: `User (${username}) added to group (${groupname})`
  }
}

async function removeUserFromGroup (username, groupname) {
  console.log(`removeUserFromGroup (${username}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: username
  }

  await cognitoIdentityServiceProvider.adminRemoveUserFromGroup(params).promise()
  return {
    message: `User (${username}) removed from group (${groupname})`
  }
}

async function disableUser (username) {
  console.log(`disableUser(${username})`)
  const params = {
    UserPoolId: userPoolId,
    Username: username
  }

  await cognitoIdentityServiceProvider.adminDisableUser(params).promise()
  return {
    message: `User (${username}) disabled`
  }
}

async function enableUser (username) {
  console.log(`enableUser(${username})`)
  const params = {
    UserPoolId: userPoolId,
    Username: username
  }

  await cognitoIdentityServiceProvider.adminEnableUser(params).promise()
  return {
    message: `User (${username}) enabled`
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
    username: d.Username,
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
  console.log(`listUsersInGroup(iter=${iter})`)

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

async function listGroupsForUser (username) {
  const params = {
    UserPoolId: userPoolId,
    Username: username
  }

  const result = await cognitoIdentityServiceProvider.adminListGroupsForUser(params).promise()
  return result.Groups.map(d => d.GroupName)
}

async function getUsers (req, res, next) {
  let users = []
  try {
    users = await listUsers()
  } catch (err) {
    console.log(err)
    return next(createError(500, 'Failed to list users'))
  }

  res.status(200).json(users)
}

async function fetchUser (username) {
  console.log(`fetchUser(${username})`)
  const params = {
    UserPoolId: userPoolId,
    Username: username
  }
  try {
    return await cognitoIdentityServiceProvider.adminGetUser(params).promise()
  } catch (err) {
    if (err.code && err.code === 'UserNotFoundException') {
      console.log(`user (${username}) not found`)
      return null
    }
    console.log(err)
    throw createError(500, 'Failed to get user')
  }
}

async function getUser (req, res, next) {
  res.status(200).json(res.locals.adminUser)
}

async function putUser (req, res, next) {
  let response
  if (req.body.action === 'enable') {
    response = await enableUser(res.locals.adminUser.username)
  } else if (req.body.action === 'disable') {
    response = await disableUser(res.locals.adminUser.username)
  } else if (req.body.action === 'addToAdmin') {
    response = await addUserToGroup(res.locals.adminUser.username, 'admins')
  } else if (req.body.action === 'removeFromAdmin') {
    response = await removeUserFromGroup(res.locals.adminUser.username, 'admins')
  } else if (req.body.action === 'signOut') {
    response = await signOutUser(res.locals.adminUser.username)
  } else {
    throw createError(400, 'Invalid user action')
  }
  return res.status(200).json(response)
}

async function signOutUser (username) {
  const params = {
    UserPoolId: userPoolId,
    Username: username
  }

  await cognitoIdentityServiceProvider.adminUserGlobalSignOut(params).promise()
  return {
    message: `User (${username}) signed out from all devices`
  }
}

module.exports = {
  attachAdminUser,
  getUsers,
  getUser,
  putUser
}
