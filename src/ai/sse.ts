/**
 * Server-sent events from a fetch() body: yields each event's `data` (the
 * lines joined) and its `event` name. Handles CRLF, multi-line data, comments
 * and a final event without a trailing blank line.
 */
export async function* sse(res: Response, signal?: AbortSignal): AsyncGenerator<{ event: string; data: string }> {
  if (!res.body) return
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  let event = ''
  let data: string[] = []
  const flush = function* () {
    if (data.length) yield { event, data: data.join('\n') }
    event = ''
    data = []
  }
  try {
    for (;;) {
      if (signal?.aborted) return
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).replace(/\r$/, '')
        buf = buf.slice(nl + 1)
        if (line === '') yield* flush()
        else if (line.startsWith(':')) continue
        else {
          const i = line.indexOf(':')
          const field = i < 0 ? line : line.slice(0, i)
          const val = i < 0 ? '' : line.slice(i + 1).replace(/^ /, '')
          if (field === 'data') data.push(val)
          else if (field === 'event') event = val
        }
      }
    }
    if (buf.trim()) {
      const line = buf.replace(/\r$/, '')
      if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
    }
    yield* flush()
  } finally {
    reader.releaseLock()
  }
}
