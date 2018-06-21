const Reader = require('.').reader
const fs = require('fs')

const reader = Reader()
const mp3 = fs.createReadStream('./15295776881950.mp3')

mp3.on('data', chunk => {
  console.log(chunk)
  reader(chunk)
})

mp3.on('end', () => {
  reader(null)
})
