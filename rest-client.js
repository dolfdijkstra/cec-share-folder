/*
 * Copyright (C) 2017 Dolf Dijkstra
 *
 * This software may be modified and distributed under the terms
 * of the MIT license.  See the LICENSE file for details.
 */

const request = require('request-promise-native')

const urls = {
  components: {
    IdcService: 'SCS_BROWSE_APPS',
    suppressHttpErrorCodes: 1,
    appCount: 100,
    appStartRow: 0,
    appsSortField: 'fFolderName',
    appsSortOrder: 'Asc',
    dMetadataSerializer: 'BaseSerializer'
  },
  templates: {
    IdcService: 'SCS_BROWSE_SITES',
    suppressHttpErrorCodes: 1,
    siteCount: 100,
    siteStartRow: 0,
    fApplication: 'framework.site.template',
    sitesSortField: 'fFolderName',
    sitesSortOrder: 'Asc',
    dMetadataSerializer: 'BaseSerializer'
  },
  sites: {
    IdcService: 'SCS_BROWSE_SITES',
    suppressHttpErrorCodes: 1,
    siteCount: 100,
    siteStartRow: 0,
    sitesSortField: 'fFolderName',
    sitesSortOrder: 'Asc',
    dMetadataSerializer: 'BaseSerializer'
  },
  contenttypes: {
    IdcService: 'CAAS_BROWSE_CONTENT_TYPES',
    suppressHttpErrorCodes: 1,
    folderCount: 100,
    folderStartRow: 0,
    foldersSortField: 'fFolderName',
    foldersSortOrder: 'Asc',
    doRetrieveMetadata: 1
  }
}

class REST {
  constructor(jar, host) {
    this.jar = jar
    this.host = host
  }
  get(qs) {
    let options = {
      method: 'GET',
      jar: this.jar,
      json: true,
      uri: this.host + '/documents/web',
      qs: qs
    }
    return request(options)
  }

  idc(type, rsType) {
    return this.get(urls[type]).then(body => {
      return body.ResultSets[rsType].rows.map(e => ({
        guid: e[0],
        name: e[2],
        type: type
      }))
    })
  }

  getComponents() {
    return this.idc('components', 'AppInfo')
  }

  getTemplates() {
    return this.idc('templates', 'SiteInfo')
  }

  getSites() {
    return this.idc('sites', 'SiteInfo')
  }

  getContentTypes() {
    return this.idc('contenttypes', 'ContentTypes')
  }
}

module.exports = (jar, base) => new REST(jar, base)
