export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key]
    return value !== undefined ? String(value) : `{${key}}`
  })
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}
