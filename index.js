/*
 * Copyright (C) 2017 Dolf Dijkstra
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const login = require('./login')
const restClient = require('./rest-client')

const flatten = ar => ar.reduce((a, b) => a.concat(b), [])

const formatters = {
  printGuids: list => console.log(list.map(e => e.guid).join(' ')),
  printList: list =>
    list.forEach(e => console.log('%s\t%s\t%s', e.guid, e.name, e.type))
}

const collectFolders = jar => {
  const client = restClient(jar, ctx.host)
  return Promise.all([
    client.getContentTypes(),
    client.getComponents(),
    client.getTemplates(),
    client.getSites()
  ])
}
const ctx = {
  host: process.env.CEC_URL,
  domain: process.env.CEC_DOMAIN,
  user: process.env.CEC_USER,
  password: process.env.CEC_PW
}

login(ctx)
  .then(collectFolders)
  .then(flatten)
  .then(formatters.printList)
  .catch(console.err)
