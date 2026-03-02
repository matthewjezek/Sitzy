export function nowForDatetimeInput(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 16)
}

export function localInputToUTC(localDateTimeStr: string): string {
  return new Date(localDateTimeStr).toISOString()
}

export function formatLocalDateTime(utcIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcIso))
}