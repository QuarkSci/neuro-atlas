/** Tab-separated text Anki imports (File → Import): front, back and an optional tags column (space-separated tags). */
export interface AnkiCard {
  front: string
  back: string
  tags?: string
}

// Tabs and newlines inside a field would break the columns.
const clean = (x: string) => x.replace(/[\t\r\n]+/g, ' ').trim()

export function ankiText(deck: string, cards: AnkiCard[]): string {
  const tagged = cards.some((c) => c.tags)
  return [
    '#separator:tab',
    '#html:false',
    `#deck:${clean(deck)}`,
    ...(tagged ? ['#tags column:3'] : []),
    ...cards.map((c) => [clean(c.front), clean(c.back), ...(tagged ? [clean(c.tags ?? '')] : [])].join('\t')),
  ].join('\n')
}

export function downloadAnki(deck: string, cards: AnkiCard[]) {
  const url = URL.createObjectURL(new Blob([ankiText(deck, cards)], { type: 'text/plain;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${clean(deck).replace(/[^\w-]+/g, '_') || 'neuro-atlas'}.txt`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
