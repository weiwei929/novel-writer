// 最小测试服务器
import express from 'express'

const app = express()
const PORT = 5000

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' })
})

console.log('Starting minimal test server...')

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`)
  console.log(`🔍 Server address: ${JSON.stringify(server.address())}`)
})

server.on('error', (error) => {
  console.error('❌ Server error:', error)
})

// 保持进程运行
process.on('SIGINT', () => {
  console.log('Shutting down...')
  server.close(() => {
    process.exit(0)
  })
})