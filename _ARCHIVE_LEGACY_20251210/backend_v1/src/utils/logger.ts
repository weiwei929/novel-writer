import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 定义日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// 定义日志级别颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// 控制台格式（开发环境）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    info => `${info.timestamp} [${info.level}]: ${info.message} ${info.stack || ''}`
  )
)

// 创建日志目录
const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs')

// 创建 Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  defaultMeta: { service: 'novel-writer-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// 导出日志方法
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => {
    logger.error(message, meta)
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta)
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta)
  },
  http: (message: string, meta?: Record<string, unknown>) => {
    logger.http(message, meta)
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta)
  },
}

// 导出默认 logger（兼容性）
export default logger
