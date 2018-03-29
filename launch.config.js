const { resolve } = require('path')

const basicConnector = {
  script: resolve(__dirname, '../../interledgerjs/ilp-connector/src/index.js'),
  env: {
    DEBUG: 'connector*,ilp*',
    CONNECTOR_STORE: 'memdown',
    CONNECTOR_BACKEND: 'one-to-one'
  }
}

const basicPlugin = {
  plugin: 'ilp-plugin-btp',
  assetCode: 'USD',
  assetScale: 9
}

const services = []

services.push({
  ...basicConnector,
  name: 'u1',
  env: {
    ...basicConnector.env,
    CONNECTOR_ILP_ADDRESS: 'test.u1',
    CONNECTOR_ADMIN_API: true,
    CONNECTOR_ADMIN_API_PORT: 7701,
    CONNECTOR_ACCOUNTS: JSON.stringify({
      u2: {
        ...basicPlugin,
        relation: 'peer',
        options: {
          listener: {
            port: 10101,
            secret: 'u1u2'
          }
        }
      },
      client: {
        relation: 'child',
        plugin: 'ilp-plugin-btp',
        assetCode: 'USD',
        assetScale: 9,
        options: {
          listener: {
            port: 20001,
            secret: 'password'
          }
        }
      }
    })
  }
})

services.push({
  ...basicConnector,
  name: 'u2',
  env: {
    ...basicConnector.env,
    CONNECTOR_ILP_ADDRESS: 'test.u2',
    CONNECTOR_ADMIN_API: true,
    CONNECTOR_ADMIN_API_PORT: 7702,
    CONNECTOR_ACCOUNTS: JSON.stringify({
      u1: {
        ...basicPlugin,
        relation: 'peer',
        options: {
          server: 'btp+ws://:u1u2@localhost:10101'
        }
      },
      client: {
        relation: 'child',
        plugin: 'ilp-plugin-btp',
        assetCode: 'USD',
        assetScale: 9,
        options: {
          listener: {
            port: 20002,
            secret: 'password'
          }
        }
      }
    })
  }
})

module.exports = services
