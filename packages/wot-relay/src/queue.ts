import Database from 'better-sqlite3'

/**
 * SQLite-backed offline message queue.
 * Messages are stored when the recipient is offline and delivered when they reconnect.
 */
export class OfflineQueue {
  private db: Database.Database

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        to_did TEXT NOT NULL,
        envelope TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_to_did ON offline_queue (to_did)
    `)
  }

  enqueue(toDid: string, envelope: Record<string, unknown>): void {
    const stmt = this.db.prepare(
      'INSERT INTO offline_queue (to_did, envelope, created_at) VALUES (?, ?, ?)',
    )
    stmt.run(toDid, JSON.stringify(envelope), new Date().toISOString())
  }

  dequeue(toDid: string): Record<string, unknown>[] {
    const rows = this.db
      .prepare('SELECT id, envelope FROM offline_queue WHERE to_did = ? ORDER BY id')
      .all(toDid) as Array<{ id: number; envelope: string }>

    if (rows.length === 0) return []

    // Delete delivered messages
    this.db
      .prepare('DELETE FROM offline_queue WHERE to_did = ?')
      .run(toDid)

    return rows.map((row) => JSON.parse(row.envelope) as Record<string, unknown>)
  }

  count(toDid?: string): number {
    if (toDid) {
      const row = this.db
        .prepare('SELECT COUNT(*) as count FROM offline_queue WHERE to_did = ?')
        .get(toDid) as { count: number }
      return row.count
    }
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM offline_queue')
      .get() as { count: number }
    return row.count
  }

  close(): void {
    this.db.close()
  }
}
