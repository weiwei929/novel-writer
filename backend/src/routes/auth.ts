/**
 * 单用户认证路由
 * 处理登录、登出和状态查询
 */

import express from 'express'
import { handleLogin, handleLogout, getAuthStatus } from '../middleware/auth.js'

const router = express.Router()

/**
 * 登录接口
 * POST /auth/login
 */
router.post('/login', handleLogin)

/**
 * 登出接口  
 * POST /auth/logout
 */
router.post('/logout', handleLogout)

/**
 * 获取认证状态
 * GET /auth/status
 */
router.get('/status', getAuthStatus)

/**
 * 修改应用密码 (仅开发环境)
 */
router.post('/change-password', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'NOT_ALLOWED',
        message: '生产环境不支持动态修改密码'
      }
    })
  }

  const { currentPassword, newPassword } = req.body
  
  if (currentPassword !== process.env.APP_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CURRENT_PASSWORD',
        message: '当前密码错误'
      }
    })
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_NEW_PASSWORD',
        message: '新密码长度至少6位'
      }
    })
  }

  // 注意：这里只是演示，实际环境中需要更新 .env 文件
  process.env.APP_PASSWORD = newPassword

  res.json({
    success: true,
    message: '密码修改成功 (重启应用后生效)',
    note: '请手动更新 .env 文件中的 APP_PASSWORD'
  })
})

export default router