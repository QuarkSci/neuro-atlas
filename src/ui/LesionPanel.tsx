import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Crosshair, Search } from 'lucide-react'
import { PATHWAYS, type BodySide, type LesionLevel } from '@/data/pathways'
import { LEVELS, LEVEL_BY_ID, localise, signature, type Findings, type Lesion } from '@/data/lesions'
import { SECTION_BY_ID, type Section } from '@/data/sections'
import type { L10n } from '@/data/types'
import { useL } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'
import { plateLevel } from './pathTrace'

const TX = {
  forward: { en: 'Lesion → signs', uz: "O'choq → belgilar" },
  reverse: { en: 'Signs → lesion', uz: "Belgilar → o'choq" },
  level: { en: 'Level', uz: 'Daraja' },
  side: { en: 'Side of the lesion', uz: "O'choq tomoni" },
  zone: { en: 'Territory', uz: 'Hudud' },
  L: { en: 'Left', uz: 'Chap' },
  R: { en: 'Right', uz: "O'ng" },
  none: { en: 'None', uz: "Yo'q" },
  bodyL: { en: 'left body', uz: 'chap tana' },
  bodyR: { en: 'right body', uz: "o'ng tana" },
  both: { en: 'both sides', uz: 'ikki tomonda' },
  ipsi: { en: 'ipsilateral', uz: "o'sha tomonda" },
  contra: { en: 'contralateral', uz: 'qarama-qarshi' },
  spared: { en: 'spared', uz: 'saqlanadi' },
  lost: { en: 'Lost', uz: "Yo'qoladi" },
  open: { en: 'Open the plate', uz: 'Plastinkani ochish' },
  findings: { en: 'Which long-tract signs, on which side of the body?', uz: "Qaysi uzun yo'l belgilari, tananing qaysi tomonida?" },
  candidates: { en: 'Lesions that explain exactly these signs', uz: "Aynan shu belgilarni beradigan o'choqlar" },
  pick: { en: 'Choose at least one finding.', uz: 'Kamida bitta belgini tanlang.' },
  noMatch: {
    en: 'No single one-sided lesion gives this combination — think of two lesions or a bilateral process (anterior spinal artery, B12, demyelination).',
    uz: "Bunday birikmani bitta bir tomonlama o'choq bermaydi — ikki o'choq yoki ikki tomonlama jarayonni o'ylang (oldingi spinal arteriya, B12, demiyelinizatsiya).",
  },
  many: {
    en: 'Long-tract signs alone cannot tell these apart: the level is set by what comes with them — cranial nerves, cortical signs, a sensory level (open each one).',
    uz: "Faqat uzun yo'l belgilari ularni ajrata olmaydi: darajani ular bilan birga keladigan belgilar aniqlaydi — kalla nervlari, po'stloq belgilari, sezgi sathi (har birini oching).",
  },
  rule: {
    en: 'Rule: a lesion above a tract’s crossing gives signs on the opposite side of the body, below it on the same side.',
    uz: "Qoida: yo'l kesishmasidan yuqoridagi o'choq belgilarni tananing qarama-qarshi tomonida, pastdagisi — o'sha tomonda beradi.",
  },
} satisfies Record<string, L10n>

/**
 * The lesion simulator in the plate viewer: place a lesion (level, side,
 * territory) and read which long tracts it cuts and on which side of the
 * body; or enter the findings and get every lesion that explains them.
 */
export function LesionPanel({ section }: { section: Section }) {
  const l = useL()
  const { openSection, setPathway } = useAtlas()
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward')
  const [lesion, setLesion] = useState<Lesion>(() => ({ level: plateLevel(section) ?? 'medulla-rostral', side: 'L', zone: 'all' }))
  const [findings, setFindings] = useState<Findings>({})

  // Opening another plate moves the lesion to that plate's level.
  useEffect(() => {
    const lv = plateLevel(section)
    // A plate opened for the lesion's own level (the cord's is U1) keeps it.
    if (lv) setLesion((x) => (x.level === lv || LEVEL_BY_ID.get(x.level)?.plate === section.id ? x : { ...x, level: lv, zone: 'all' }))
  }, [section])

  const level = LEVEL_BY_ID.get(lesion.level)!
  const zone = level.zones.find((z) => z.id === lesion.zone) ?? level.zones[0]
  const sig = useMemo(() => signature(lesion), [lesion])
  const matches = useMemo(() => localise(findings), [findings])
  const anyFinding = PATHWAYS.some((p) => (findings[p.id] ?? 'none') !== 'none')

  const bodyText = (s: BodySide | 'B') => (s === 'B' ? l(TX.both) : `${l(s === 'L' ? TX.bodyL : TX.bodyR)} · ${l(s === lesion.side ? TX.ipsi : TX.contra)}`)
  const plate = level.plate ? SECTION_BY_ID.get(level.plate) : undefined

  return (
    <div className="lz">
      <div className="lz-modes" role="tablist">
        {(['forward', 'reverse'] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>
            {m === 'forward' ? <Crosshair size={13} /> : <Search size={13} />}
            {l(TX[m])}
          </button>
        ))}
      </div>

      {mode === 'forward' ? (
        <>
          <h4>{l(TX.level)}</h4>
          <div className="lz-chips">
            {LEVELS.map((lv) => (
              <button key={lv.id} className={lv.id === lesion.level ? 'on' : ''} onClick={() => setLesion({ ...lesion, level: lv.id as LesionLevel, zone: 'all' })}>
                {l(lv.name)}
              </button>
            ))}
          </div>
          <h4>{l(TX.side)}</h4>
          <div className="lz-seg">
            {(['L', 'R'] as const).map((s) => (
              <button key={s} className={lesion.side === s ? 'on' : ''} onClick={() => setLesion({ ...lesion, side: s })}>
                {l(TX[s])}
              </button>
            ))}
          </div>
          <h4>{l(TX.zone)}</h4>
          <div className="lz-chips">
            {level.zones.map((z) => (
              <button key={z.id} className={z.id === zone.id ? 'on' : ''} onClick={() => setLesion({ ...lesion, zone: z.id })}>
                {l(z.name)}
              </button>
            ))}
          </div>

          <div className="lz-table">
            {PATHWAYS.map((p) => {
              const s = sig[p.id]
              return (
                <button
                  key={p.id}
                  className={`lz-row ${s === 'none' ? 'spared' : 'hit'}`}
                  style={{ '--c': p.color } as React.CSSProperties}
                  onClick={() => setPathway(p.id)}
                  title={l(p.title)}
                >
                  <i />
                  <span className="lz-mod">
                    <b>{l(p.short)}</b>
                    <small>{l(p.modality)}</small>
                  </span>
                  <span className="lz-res">{s === 'none' ? l(TX.spared) : `${l(TX.lost)}: ${bodyText(s)}`}</span>
                </button>
              )
            })}
          </div>

          {zone.syndrome && (
            <div className="sv-syndrome lz-syn">
              <b>{l(zone.syndrome.name)}</b>
              <p>{l(zone.syndrome.extra)}</p>
              {zone.syndrome.source && (
                <a className="source-link" href={zone.syndrome.source.url} target="_blank" rel="noreferrer">
                  {zone.syndrome.source.title} <ArrowUpRight size={12} />
                </a>
              )}
            </div>
          )}
          {plate && plate.id !== section.id && (
            <button className="sv-3d" onClick={() => openSection(plate.id)}>
              {l(TX.open)} · {plate.code}
            </button>
          )}
          <p className="sv-note">{l(TX.rule)}</p>
        </>
      ) : (
        <>
          <h4>{l(TX.findings)}</h4>
          {PATHWAYS.map((p) => (
            <div key={p.id} className="lz-find" style={{ '--c': p.color } as React.CSSProperties}>
              <span className="lz-mod">
                <b>{l(p.modality)}</b>
              </span>
              <div className="lz-seg">
                {(['none', 'L', 'R'] as const).map((s) => (
                  <button key={s} className={(findings[p.id] ?? 'none') === s ? 'on' : ''} onClick={() => setFindings({ ...findings, [p.id]: s })}>
                    {l(s === 'none' ? TX.none : s === 'L' ? TX.bodyL : TX.bodyR)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <h4>{l(TX.candidates)}</h4>
          {!anyFinding ? (
            <p className="sv-hint">{l(TX.pick)}</p>
          ) : matches.length === 0 ? (
            <p className="sv-hint">{l(TX.noMatch)}</p>
          ) : (
            <>
              <div className="lz-cands">
                {matches.map((m) => {
                  const lv = LEVEL_BY_ID.get(m.level)!
                  const z = lv.zones.find((x) => x.id === m.zone)!
                  return (
                    <button
                      key={`${m.level}-${m.side}-${m.zone}`}
                      className="lz-cand"
                      onClick={() => {
                        setLesion(m)
                        setMode('forward')
                        if (lv.plate && lv.plate !== section.id) openSection(lv.plate)
                      }}
                    >
                      <span>
                        <b>{l(lv.name)}</b> · {l(TX[m.side])} · {l(z.name)}
                      </span>
                      {z.syndrome && <small>{l(z.syndrome.name)}</small>}
                    </button>
                  )
                })}
              </div>
              {matches.length > 1 && <p className="sv-note">{l(TX.many)}</p>}
            </>
          )}
        </>
      )}
    </div>
  )
}
