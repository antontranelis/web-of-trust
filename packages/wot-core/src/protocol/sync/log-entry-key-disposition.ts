export type LogEntryKeyDisposition = 'process-decrypt' | 'blocked-by-key'

export interface ClassifyLogEntryKeyDispositionInput {
  keyGeneration: number
  availableKeyGenerations: readonly number[]
}

export function classifyLogEntryKeyDisposition(
  input: ClassifyLogEntryKeyDispositionInput,
): LogEntryKeyDisposition {
  assertNonNegativeSafeInteger(input.keyGeneration, 'keyGeneration must be a non-negative safe integer')

  for (const availableKeyGeneration of input.availableKeyGenerations) {
    assertNonNegativeSafeInteger(
      availableKeyGeneration,
      'availableKeyGenerations must contain only non-negative safe integers',
    )
  }

  return input.availableKeyGenerations.includes(input.keyGeneration) ? 'process-decrypt' : 'blocked-by-key'
}

function assertNonNegativeSafeInteger(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(message)
}
