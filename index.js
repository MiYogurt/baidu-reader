const AipSpeechClient = require('baidu-aip-sdk').speech
const Speaker = require('speaker')
const lame = require('lame')
const form2 = require('from2')
const multipipe = require('multipipe')
const { resolve } = require('path')

const splitText = text => {
  // text = text.replace(/[\s\.\-\。\,\，\、\“\”]/g, '')
  process.env.DEBUG && console.log(text)
  const length = text.length
  const datas = []
  let index = 0
  while (index <= length) {
    let currentText = text.substr(index, 510)
    index += 510
    datas.push(currentText)
  }
  return datas
}

const getMp3Data = async (text, client, opts) => {
  const textArr = splitText(text)
  process.env.DEBUG && console.log(textArr)
  return Promise.all(
    textArr.map(async chunk => {
      const { data } = await client.text2audio(chunk, opts || {})
      return data
    })
  )
}

const saveFiles = async (datas, opts) => {
  const fs = require('fs')
  const path = opts.path || process.cwd()
  const getFilename =
    opts.filename || (i => resolve(`${path}/${Date.now()}${i}.mp3`))
  const wait = datas.map((data, i) => {
    return new Promise((resolve, reject) => {
      const filename = getFilename(i)
      fs.writeFile(filename, data, err => {
        if (err) {
          console.log(err)
          return reject(err)
        }
        resolve()
      })
    })
  })
  return Promise.all(wait)
}

function reader() {
  const speaker = new Speaker()
  const decoder = new lame.Decoder()
  const player = multipipe(decoder, speaker)

  let push = () => void 0
  const source = form2((size, next) => {
    push = data => next(null, data)
  })
  source.pipe(player)
  return data => push(data)
}

function initClient({ APP_ID, API_KEY, SECRET_KEY }) {
  APP_ID = APP_ID || process.env.BAIDU_READER_APP_ID
  API_KEY = API_KEY || process.env.BAIDU_READER_API_KEY
  SECRET_KEY = SECRET_KEY || process.env.BAIDU_READER_SECRET_KEY
  if (!(APP_ID && API_KEY && SECRET_KEY)) {
    return console.log('请提供 Baidu API 接口验证信息')
  }
  const client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY)
  return client
}

const play = (next, opts, client) => async text => {
  if (text === null) {
    return next(null) // 宁可报错也不要声音不全
  }

  const mp3DataArray = await getMp3Data(text, client, opts)
  mp3DataArray.forEach(next)

  if (opts && opts.save) {
    saveFiles(mp3DataArray, opts)
  }

  return () => {
    next(null)
  }
}

function init({ APP_ID, API_KEY, SECRET_KEY }, opts = {}) {
  const client = initClient({ APP_ID, API_KEY, SECRET_KEY })
  let next = reader()
  return play(next, opts, client)
}

module.exports = init
module.exports.default = init
module.exports.initClient = initClient
module.exports.reader = reader
module.exports.getMp3Data = getMp3Data
module.exports.saveFiles = saveFiles
