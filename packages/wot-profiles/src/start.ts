import { ProfileServer } from './server.js'

const PORT = parseInt(process.env.PORT ?? '8788', 10)
const DB_PATH = process.env.DB_PATH ?? './profiles.db'

const server = new ProfileServer({ port: PORT, dbPath: DB_PATH })

server.start().then(() => {
  console.log(`wot-profiles running on port ${PORT} (db: ${DB_PATH})`)
})

process.on('SIGINT', async () => {
  await server.stop()
  process.exit(0)
})
