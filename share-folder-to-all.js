/*
 * Copyright (C) 2017 Dolf Dijkstra
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const request = require('request-promise-native')
const fs = require('fs')

const base = process.env.CEC_URL
const user = process.env.CEC_USER
const password = process.env.CEC_PW
const argv = require('minimist')(process.argv.slice(2))

const role = argv.role || 'manager'
const usersFile = argv.users
const foldersFile = argv.folders

if (!usersFile) throw new Error('--users is not specified')

const read = fileName => {
  return new Promise(function(resolve, reject) {
    fs.readFile(fileName, 'utf-8', (err, data) => {
      if (err) {
        return reject(err)
      }
      return resolve(data)
    })
  })
}

const toLines = data =>
  data
    .split('\n')
    .filter(e => e.trim().length > 0)
    .filter(e => !e.startsWith('#'))

const parseFoldersFile = data =>
  toLines(data).map(l => {
    return l.split('\t')[0]
  })

const getFolders = () =>
  foldersFile
    ? read(foldersFile).then(parseFoldersFile)
    : Promise.resolve(argv._)

let auth = {
  user: user,
  pass: password,
  sendImmediately: true
}

const getUser = name => {
  let options = {
    method: 'GET',
    auth: auth,
    json: true,
    uri: base + '/documents/api/1.2/users/items',
    qs: {
      info: name
    }
  }
  /* items:
         [ { type: 'user',
             id: 'UAAC3A1C57FCBC431624F655D4018AFDB5A0',
             displayName: 'Demo User1',
             loginName: 'demouser1' },
             */
  return request(options).then(body =>
    body.items.filter(e => e.type === 'user' && e.loginName === name)
  )
}

const sharesCache = {}
const shares = folder => {
  let c = sharesCache[folder]
  if (c) return Promise.resolve(c)
  let options = {
    method: 'GET',
    auth: auth,
    json: true,
    uri: base + '/documents/api/1.2/shares/' + folder + '/items',
    qs: {
      currentOnly: true
    }
    /*
        "items": [
                {
                    "type": "share",
                    "user": {
                        "displayName": "User BB",
                        "loginName": "userBBLoginName",
                        "id": "U7ECC74059E0FEDFEC66BF5AT00000000001",
                        "type": "user"
                    },
                    "role": "manager"
                }
                */
  }
  return request(options).then(r => {
    sharesCache[folder] = r
    return r
  })
}
const userShareFilter = userId => response =>
  response.items.filter(e => e.type === 'share' && e.user.id === userId)

const ops = {
  share: (folder, user) => {
    let addRole = {
      method: 'POST',
      auth: auth,
      json: true,
      uri: base + '/documents/api/1.2/shares/' + folder,
      body: {
        userID: user,
        role: role,
        message: 'Granting you access to this folder as a ' + role
      }
    }
    let changeRole = {
      method: 'PUT',
      auth: auth,
      json: true,
      uri: base + '/documents/api/1.2/shares/' + folder + '/role',
      body: {
        userID: user,
        role: role,
        message: 'Changed you role for this folder to ' + role
      }
    }
    return shares(folder)
      .then(userShareFilter(user))
      .then(u => {
        if (u.length > 0) {
          return u[0].role === role ? Promise.resolve({}) : request(changeRole)
        } else return request(addRole)
      })
  },
  unshare: (folder, user) => {
    let options = {
      method: 'DELETE',
      auth: auth,
      json: true,
      uri: base + '/documents/api/1.2/shares/' + folder + '/user',

      body: {
        userID: user,
        message: 'Removing your access to this shared folder.'
      }
    }
    return request(options)
  }
}

const findUser = userName =>
  getUser(userName).then(users => (users.length > 0 ? users[0].id : false))

const processUsers = (userNames, folders, operation) => {
  // First collect all user Guids
  // Then per user, operate on the folders
  return Promise.all(userNames.map(user => findUser(user)))
    .then(userGuids => {
      let validUsers = userGuids.filter(e => e !== false)
      return Promise.all(
        validUsers.map(user =>
          Promise.all(folders.map(folder => operation(folder, user)))
        )
      )
    })
    .catch(console.err)
}

async function work() {
  if (!usersFile) {
    throw new Error(
      'Please provide --users as an argument, pointing to a file with a userid per line.'
    )
  }

  const [folders, users] = await Promise.all([
    getFolders(),
    read(usersFile).then(toLines)
  ])

  if (folders.length === 0) {
    throw new Error(
      'Please provide a --folders <file> or a folder GUID as an argument.'
    )
  }
  console.log('folders: ', folders.join(','))

  console.log('users: ', users.join(','))
  console.log('doing %s operations.', users.length * folders.length)
  const operation = argv.operation === 'unshare' ? ops.unshare : ops.share
  return processUsers(users, folders, operation)
}

work()
  .then(() => console.log('done'))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
