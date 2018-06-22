# Baidu Reader

goto `https://ai.baidu.com/` and reading `https://ai.baidu.com/docs#/TTS-Online-Node-SDK/top` create you self api key.

```js
const Reader = require('baidu-reader')

const reader = Reader(
  {
    APP_ID: 'xxxxx',
    API_KEY: 'xxxxxxx',
    SECRET_KEY: 'xxxxxxxxx'
  },
  {
    save: true,
    path: __dirname
  }
)
;(async () => {
  await reader('新建一个对象，建议只保存一个对象调用服务接口')
  await reader(
    '为了使开发者更灵活的控制请求，模块提供了设置全局参数和全局请求拦截器的方法；本库发送网络请求依赖的是request模块，因此参数格式与request模块的参数相同 更多参数细节您可以参考request官方参数文档。'
  )
  await reader(null) // close
})()
```
