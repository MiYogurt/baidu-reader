const AipSpeechClient = require('baidu-aip-sdk').speech
const Speaker = require('speaker')
const lame = require('lame')
const form2 = require('from2')
const multipipe = require('multipipe')

const splitText = text => {
  text = text.replace(/[\s\.\-\。\,\，\、]/g, '')
  process.env.DEBUG && console.log(text)
  const length = text.length
  const datas = []
  let index = 0
  while (index <= length) {
    let currentText = text.substring(index, 510)
    index += 510
    datas.push(currentText)
  }
  return datas
}

const getMp3Data = async (textArr, client, opts) => {
  return Promise.all(
    textArr.map(async chunk => {
      const { data } = await client.text2audio(chunk, opts || {})
      return data
    })
  )
}

const saveFiles = async (datas, opts) => {
  const fs = require('fs')
  const path = opts.path || process.pwd()
  const wait = datas.map((data, i) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(`${path}/${Date.now()}${i}.mp3`, data, err => {
        if (err) {
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

function init({ APP_ID, API_KEY, SECRET_KEY }, opts = {}) {
  APP_ID = APP_ID || process.env.BAIDU_READER_APP_ID
  API_KEY = API_KEY || process.env.BAIDU_READER_API_KEY
  SECRET_KEY = SECRET_KEY || process.env.BAIDU_READER_SECRET_KEY
  if (!(APP_ID && API_KEY && SECRET_KEY)) {
    return console.log('请提供 Baidu API 接口验证信息')
  }
  const client = new AipSpeechClient(APP_ID, API_KEY, SECRET_KEY)
  let push = reader()
  return async text => {
    if (text === null) {
      return push(null) // 宁可报错也不要声音不全
    }
    const textArr = splitText(text)
    console.log(textArr)
    const mp3DataArray = await getMp3Data(textArr, client, opts)
    mp3DataArray.forEach(push)
    if (opts && opts.save) {
      saveFiles(mp3DataArray, opts)
    }
    return () => {
      push(null)
    }
  }
}

module.exports = init
module.exports.reader = reader
