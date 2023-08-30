import dotenv from 'dotenv'

dotenv.config()

const config = {
  server: {
    host: process.env.HOST,
    port: process.env.PORT
  },
  s3: {
    bucketName: process.env.AWS_BUCKET_NAME
  },
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER
  },
  redis: {
    host: process.env.REDIS_SERVER
  },
  jwt: {
    accesskey: process.env.ACCESS_TOKEN_KEY,
    refreshkey: process.env.REFRESH_TOKEN_KEY,
    accessage: process.env.ACCESS_TOKEN_AGE
  }
}

export default config
