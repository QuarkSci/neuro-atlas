import { Fragment, type ReactNode } from 'react'

/**
 * A small, safe Markdown renderer for AI answers: paragraphs, headings,
 * bullet and numbered lists, block quotes, fenced code, and inline bold,
 * italic, code and http(s) links. It builds React nodes — never HTML strings —
 * so nothing a model writes can inject markup or script.
 */
export function Markdown({ text }: { text: string }) {
  return <>{blocks(text)}</>
}

function blocks(src: string): ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  let i = 0
  let k = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^```/.test(line)) {
      const body: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++])
      i++
      out.push(<pre key={k++}>{body.join('\n')}</pre>)
      continue
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line)
    if (h) {
      out.push(
        <p key={k++} className={`md-h md-h${h[1].length}`}>
          {inline(h[2])}
        </p>,
      )
      i++
      continue
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, '')
        // Continuation lines indented under the item.
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) item += ' ' + lines[i++].trim()
        items.push(item)
      }
      const List = ordered ? 'ol' : 'ul'
      out.push(
        <List key={k++}>
          {items.map((t, j) => (
            <li key={j}>{inline(t)}</li>
          ))}
        </List>,
      )
      continue
    }
    if (/^>\s?/.test(line)) {
      const q: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''))
      out.push(<blockquote key={k++}>{inline(q.join(' '))}</blockquote>)
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|>|\s*([-*•]|\d+[.)])\s+)/.test(lines[i])) para.push(lines[i++])
    out.push(<p key={k++}>{inline(para.join(' '))}</p>)
  }
  return out
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g

function inline(s: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of s.matchAll(INLINE)) {
    if (m.index! > last) out.push(<Fragment key={k++}>{s.slice(last, m.index)}</Fragment>)
    const t = m[0]
    if (m[1]) out.push(<code key={k++}>{t.slice(1, -1)}</code>)
    else if (m[2]) out.push(<strong key={k++}>{inline(t.slice(2, -2))}</strong>)
    else if (m[3]) out.push(<em key={k++}>{inline(t.slice(1, -1))}</em>)
    else {
      const [, label, href] = /^\[([^\]]+)\]\((.+)\)$/.exec(t)!
      out.push(
        <a key={k++} href={href} target="_blank" rel="noreferrer noopener">
          {label}
        </a>,
      )
    }
    last = m.index! + t.length
  }
  if (last < s.length) out.push(<Fragment key={k++}>{s.slice(last)}</Fragment>)
  return out
}
