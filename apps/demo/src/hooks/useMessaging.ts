import { useCallback, useEffect, useRef } from 'react'
import { useAdapters } from '../context'
import type { MessageEnvelope } from '@real-life/wot-core'

export function useMessaging() {
  const { messaging, messagingState } = useAdapters()
  const callbacksRef = useRef<Set<(envelope: MessageEnvelope) => void>>(new Set())

  // Single onMessage subscription that dispatches to all registered callbacks
  useEffect(() => {
    const unsubscribe = messaging.onMessage((envelope) => {
      for (const cb of callbacksRef.current) {
        cb(envelope)
      }
    })
    return unsubscribe
  }, [messaging])

  const onMessage = useCallback((callback: (envelope: MessageEnvelope) => void) => {
    callbacksRef.current.add(callback)
    return () => {
      callbacksRef.current.delete(callback)
    }
  }, [])

  const send = useCallback(
    (envelope: MessageEnvelope) => messaging.send(envelope),
    [messaging],
  )

  return {
    send,
    onMessage,
    state: messagingState,
    isConnected: messagingState === 'connected',
  }
}
