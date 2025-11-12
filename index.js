import express from 'express'
import fetch from 'node-fetch'
const app = express()
const port = process.env.PORT || 8000

// Base58 编码函数
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function base58Encode(obj) {
  const str = JSON.stringify(obj)
  const bytes = Buffer.from(str, 'utf8')
  let intVal = 0n
  for (let b of bytes) {
    intVal = (intVal << 8n) + BigInt(b)
  }
  let result = ''
  while (intVal > 0n) {
    const mod = intVal % 58n
    result = BASE58_ALPHABET[Number(mod)] + result
    intVal = intVal / 58n
  }
  for (let b of bytes) {
    if (b === 0) result = BASE58_ALPHABET[0] + result
    else break
  }
  return result
}

// JSON 前缀替换
function addOrReplacePrefix(obj, newPrefix) {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(item => addOrReplacePrefix(item, newPrefix))
  const newObj = {}
  for (const key in obj) {
    if (key === 'api' && typeof obj[key] === 'string') {
      let apiUrl = obj[key]
      const urlIndex = apiUrl.indexOf('?url=')
      if (urlIndex !== -1) apiUrl = apiUrl.slice(urlIndex + 5)
      if (!apiUrl.startsWith(newPrefix)) apiUrl = newPrefix + apiUrl
      newObj[key] = apiUrl
    } else {
      newObj[key] = addOrReplacePrefix(obj[key], newPrefix)
    }
  }
  return newObj
}

// 通用 CORS 中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// 主处理逻辑
app.all('/', async (req, res) => {
  const targetUrl = req.query.url
  const configParam = req.query.config
  const prefixParam = req.query.prefix
  const encodeParam = req.query.encode
  const pathNameParam = req.query.path_name || 'LunaTV-config'
  const currentOrigin = `${req.protocol}://${req.get('host')}`
  const defaultPrefix = `${currentOrigin}/?url=`

  try {
    // --- 代理模式 ---
    if (targetUrl) {
      const fullUrl = decodeURIComponent(targetUrl)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(fullUrl, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
        signal: controller.signal
      })
      clearTimeout(timeout)

      // 复制响应头
      res.status(response.status)
      response.headers.forEach((v, k) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(k.toLowerCase())) {
          res.setHeader(k, v)
        }
      })

      response.body.pipe(res)
      return
    }

    // --- JSON 配置 + API 前缀替换 ---
    if (configParam === '1' || configParam === '0') {
      const jsonUrl = `https://raw.githubusercontent.com/qianqikun/LunaTV-config/main/${pathNameParam}.json`
      const response = await fetch(jsonUrl).catch(err => {
        console.log("fetch jsonUrl error", err)
        throw err
      })
      const data = await response.json()

      const finalData = configParam === '1'
        ? addOrReplacePrefix(data, prefixParam || defaultPrefix)
        : data

      if (encodeParam === 'base58') {
        const encoded = base58Encode(finalData)
        res.type('text/plain').send(encoded)
      } else {
        res.json(finalData)
      }
      return
    }

    // --- 默认主页 ---
    res.type('html').send(`
      <h1>🔄 API 中转代理服务</h1>
      <p>通用 API 中转代理，用于访问被墙或限制的接口。</p>
      <p>使用示例: <code>${defaultPrefix}https://example.com/api</code></p>
      <p>JSON 配置订阅: <code>${currentOrigin}?config=1</code></p>
    `)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
})