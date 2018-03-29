'use strict'

const IlpPacket = require('ilp-packet')
const Plugin = require('ilp-plugin-btp')
const { randomBytes, createHash } = require('crypto')
const ILDCP = require('ilp-protocol-ildcp')
const { Writer } = require('oer-utils')

const conditionMap = new Map()

;(async () => {
  const sender = new Plugin({
    server: 'btp+ws://:password@localhost:20001'
  })

  console.log(`connecting to test.u1`)
  await sender.connect()

  const { clientAddress } = await ILDCP.fetch(sender.sendData.bind(sender))

  sender.registerDataHandler(data => {
    const { executionCondition } = IlpPacket.deserializeIlpPrepare(data)

    const fulfillment = conditionMap.get(executionCondition.toString('base64'))
    if (fulfillment) {
      return IlpPacket.serializeIlpFulfill({
        fulfillment: fulfillment,
        data: Buffer.alloc(0)
      })
    } else {
      throw new Error('unexpected packet.')
    }
  })

  const destination = `test.u2`
  console.log(`test.u1 => ${destination}`)

  const fulfillment = randomBytes(32)
  const condition = createHash('sha256').update(fulfillment).digest()

  conditionMap.set(condition.toString('base64'), fulfillment)

  const writer = new Writer()

  writer.write(Buffer.from('ECHOECHOECHOECHO', 'ascii'))
  writer.writeUInt8(0)
  writer.writeVarOctetString(Buffer.from(clientAddress, 'ascii'))

  const result = await sender.sendData(IlpPacket.serializeIlpPrepare({
    destination,
    amount: '100',
    executionCondition: condition,
    expiresAt: new Date(Date.now() + 30000),
    data: writer.getBuffer()
  }))

  const parsedPacket = IlpPacket.deserializeIlpPacket(result)
  if (parsedPacket.type !== IlpPacket.Type.TYPE_ILP_FULFILL) {
    console.log(parsedPacket)
    process.exit(1)
  }

  console.log(parsedPacket)
})()
  .catch(console.error)
