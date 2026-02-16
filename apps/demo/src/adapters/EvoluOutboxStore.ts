/**
 * EvoluOutboxStore - Persistent OutboxStore backed by Evolu
 *
 * Stores unsent message envelopes in Evolu (SQLite via OPFS).
 * Data survives page reloads and app restarts.
 * Pattern follows EvoluPublishStateStore.
 */
import {
  NonEmptyString,
  NonEmptyString1000,
  booleanToSqliteBoolean,
  createIdFromString,
  type Evolu,
} from '@evolu/common'
import type {
  OutboxStore,
  OutboxEntry,
  MessageEnvelope,
  Subscribable,
} from '@real-life/wot-core'
import type { AppSchema } from '../db'

type AppEvolu = Evolu<AppSchema>

const str = (s: string) => NonEmptyString1000.orThrow(s)
const longStr = (s: string) => NonEmptyString.orThrow(s)

export class EvoluOutboxStore implements OutboxStore {
  constructor(private evolu: AppEvolu) {}

  async enqueue(envelope: MessageEnvelope): Promise<void> {
    // Idempotent: check if already exists
    if (await this.has(envelope.id)) return

    this.evolu.upsert('outbox', {
      id: createIdFromString<'Outbox'>(`outbox-${envelope.id}`),
      envelopeId: str(envelope.id),
      envelopeJson: longStr(JSON.stringify(envelope)),
      retryCount: str('0'),
    })
  }

  async dequeue(envelopeId: string): Promise<void> {
    this.evolu.update('outbox', {
      id: createIdFromString<'Outbox'>(`outbox-${envelopeId}`),
      isDeleted: booleanToSqliteBoolean(true),
    })
  }

  async getPending(): Promise<OutboxEntry[]> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('outbox')
        .selectAll()
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
        .orderBy('createdAt', 'asc')
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.map((row) => ({
      envelope: JSON.parse(row.envelopeJson as string) as MessageEnvelope,
      createdAt: (row as any).createdAt as string,
      retryCount: parseInt(row.retryCount as string, 10),
    }))
  }

  async has(envelopeId: string): Promise<boolean> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('outbox')
        .select('id')
        .where('envelopeId', '=', str(envelopeId))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.length > 0
  }

  async incrementRetry(envelopeId: string): Promise<void> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('outbox')
        .select(['id', 'retryCount'])
        .where('envelopeId', '=', str(envelopeId))
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    if (rows.length === 0) return

    const row = rows[0]
    const current = parseInt(row.retryCount as string, 10)
    this.evolu.update('outbox', {
      id: row.id,
      retryCount: str(String(current + 1)),
    })
  }

  async count(): Promise<number> {
    const query = this.evolu.createQuery((db) =>
      db.selectFrom('outbox')
        .select('id')
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )
    const rows = await this.evolu.loadQuery(query)
    return rows.length
  }

  /**
   * Reactive pending count for UI (e.g. badge on outbox indicator).
   */
  watchPendingCount(): Subscribable<number> {
    const evolu = this.evolu
    const query = evolu.createQuery((db) =>
      db.selectFrom('outbox')
        .select('id')
        .where('isDeleted', 'is not', booleanToSqliteBoolean(true))
    )

    const readCount = (): number => {
      return [...evolu.getQueryRows(query)].length
    }

    let snapshot = readCount()

    return {
      subscribe: (callback) => {
        const unsub = evolu.subscribeQuery(query)(() => {
          const updated = readCount()
          if (updated !== snapshot) {
            snapshot = updated
            callback(snapshot)
          }
        })
        evolu.loadQuery(query).then(() => {
          const loaded = readCount()
          if (loaded !== snapshot) {
            snapshot = loaded
            callback(snapshot)
          }
        })
        return unsub
      },
      getValue: () => snapshot,
    }
  }
}
