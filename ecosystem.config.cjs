/** PM2: API + worker. Raise ysk-api instances only when REDIS_URL is set (Socket.IO Redis adapter). */
module.exports = {
  apps: [
    {
      name: 'ysk-api',
      script: 'apps/api/dist/main.js',
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', RUN_WORKERS: '0' },
    },
    {
      name: 'ysk-worker',
      script: 'apps/api/dist/worker.js',
      interpreter: 'node',
      interpreter_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
    },
  ],
};
