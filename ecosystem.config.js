module.exports = {
  apps: [
    {
      name: 'novel-writer-backend',
      script: './backend/dist/index.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0',
      },
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G',
      restart_delay: 3000,
      autorestart: true,
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        'data'
      ]
    }
  ]
}