import Database from 'better-sqlite3'

export interface StoredProfile {
  did: string
  jws: string
  updatedAt: string
}

export class ProfileStore {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        did TEXT PRIMARY KEY,
        jws TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }

  put(did: string, jws: string): void {
    const now = new Date().toISOString()
    this.db.prepare(`
      INSERT INTO profiles (did, jws, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(did) DO UPDATE SET
        jws = excluded.jws,
        updated_at = excluded.updated_at
    `).run(did, jws, now)
  }

  get(did: string): StoredProfile | null {
    const row = this.db.prepare(
      'SELECT did, jws, updated_at FROM profiles WHERE did = ?'
    ).get(did) as { did: string; jws: string; updated_at: string } | undefined

    if (!row) return null
    return { did: row.did, jws: row.jws, updatedAt: row.updated_at }
  }

  close(): void {
    this.db.close()
  }
}
