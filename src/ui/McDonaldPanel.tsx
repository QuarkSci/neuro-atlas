import { useMemo, useState } from 'react'
import { Check, Clock, X } from 'lucide-react'
import type { L10n } from '@/data/types'
import { useL } from '@/i18n'
import type { FocalLesion, FocalSet } from './lesionFocal'
import { MC_AREAS, MIN_DIAMETER_MM, NO_EXTRA, mcdonald, type McArea, type McExtra } from './mcdonald'

const TX = {
  title: { en: 'Multiple sclerosis criteria (McDonald)', uz: 'Tarqoq skleroz mezonlari (McDonald)' },
  axis: { en: 'Time axis', uz: "Vaqt o'qi" },
  all: { en: 'All', uz: 'Hammasi' },
  month: { en: 'mo', uz: 'oy' },
  at: { en: 'Appears at', uz: "Paydo bo'lgan vaqti" },
  gd: { en: 'Gd+ (enhancing)', uz: "Gd+ (kontrast yig'adi)" },
  later: { en: 'This lesion appears later on the time axis.', uz: "Bu o'choq vaqt o'qida keyinroq paydo bo'ladi." },
  areas: { en: 'CNS areas (dissemination in space)', uz: 'MNS sohalari (makonda tarqalish)' },
  outside: { en: 'Findings outside the plates', uz: 'Plastinkalardan tashqari topilmalar' },
  cord: { en: 'Spinal cord lesion', uz: "Orqa miya o'chog'i" },
  cortex: { en: 'Cortical lesion', uz: "Po'stloq o'chog'i" },
  optic: { en: 'Optic nerve (MRI / OCT / VEP)', uz: "Ko'ruv nervi (MRT / OKT / VEP)" },
  opticAttack: { en: 'Optic neuritis attack', uz: 'Optik nevrit xuruji' },
  csf: { en: 'CSF: OCB / κFLC', uz: 'Likvor: OCB / κFLC' },
  cvs: { en: 'Central vein sign / rim lesion', uz: "Markaziy vena belgisi / chetli o'choq" },
  attacks: { en: 'Clinical attacks', uz: 'Klinik xurujlar' },
  clinical: { en: 'lesions with signs', uz: "belgili o'choqlar" },
  dis: { en: 'Dissemination in space', uz: 'Makonda tarqalish (DIS)' },
  dit: { en: 'Dissemination in time', uz: 'Vaqtda tarqalish (DIT)' },
  ditGd: { en: 'Gd+ and Gd− on one scan', uz: 'bitta MRTda Gd+ va Gd−' },
  ditNew: { en: 'new lesion on follow-up', uz: "kuzatuv MRTda yangi o'choq" },
  ditCsf: { en: 'CSF oligoclonal bands', uz: 'likvorda oligoklonal chiziqlar' },
  ditAttacks: { en: 'second attack', uz: 'ikkinchi xuruj' },
  ms: { en: 'Criteria met: multiple sclerosis', uz: 'Mezonlar bajarildi: tarqoq skleroz' },
  notYet: { en: 'Not yet: ', uz: 'Hali emas: ' },
  needDis: { en: 'a lesion in another area (DIS)', uz: "boshqa sohada o'choq (DIS)" },
  needDit: { en: 'DIT — a new or enhancing lesion, or CSF bands', uz: "DIT — yangi yoki Gd+ o'choq, yoki likvor chiziqlari" },
  needAttack: { en: 'a clinical attack', uz: 'klinik xuruj' },
  needSupport: { en: 'DIT, positive CSF or a central vein sign / rim lesion', uz: "DIT, musbat likvor yoki markaziy vena belgisi / chetli o'choq" },
  ris: {
    en: 'Radiologically isolated syndrome: MRI shows DIS without any attack — not MS under 2017; under 2024 it can be.',
    uz: "Radiologik izolyatsiyalangan sindrom: MRTda DIS bor, xuruj yo'q — 2017 bo'yicha TS emas; 2024 bo'yicha bo'lishi mumkin.",
  },
  small: {
    en: 'Under {mm} mm across: too small for a McDonald T2 lesion, not counted.',
    uz: "Diametri {mm} mm dan kichik: McDonald T2 o'chog'i uchun juda kichik, hisobga olinmaydi.",
  },
  deep: { en: 'deep (no area)', uz: 'chuqur (soha emas)' },
  tumefactive: {
    en: 'Lesion over 2 cm: tumefactive — exclude tumour, abscess, ADEM before MS.',
    uz: "2 sm dan katta o'choq: tumefaktiv — TS dan oldin o'sma, abssess, ADEM istisno qilinsin.",
  },
  vascular: {
    en: 'All at once, each filling an arterial territory: stroke or emboli until proven otherwise — "no better explanation" is part of McDonald.',
    uz: 'Hammasi bir vaqtda va har biri arterial hududni to\'ldiradi: isbotlanmaguncha insult yoki emboliya — "yaxshiroq izoh yo\'q" McDonald shartining bir qismi.',
  },
  plate: {
    en: 'Areas from the plates: brainstem → infratentorial; on forebrain plates touching the lateral ventricle → periventricular, the insular cortex → juxtacortical; the rest is deep white/grey matter. Simplified for teaching; ages over 50 and vascular risk need stricter rules.',
    uz: "Plastinkadan soha: miya ustuni → infratentorial; oldingi miya plastinkasida yon qorinchaga tegsa → periventrikulyar, orolcha po'stlog'iga → po'stloq yoni; qolgani chuqur modda. O'quv uchun soddalashtirilgan; 50 yoshdan kattalarda va tomir xavfida qat'iyroq qoidalar bor.",
  },
  ref: {
    en: 'Thompson et al., Lancet Neurol 2018;17:162 (2017 criteria) · Montalban et al., Lancet Neurol 2025;24:850 (2024 revision).',
    uz: 'Thompson va boshq., Lancet Neurol 2018;17:162 (2017 mezonlari) · Montalban va boshq., Lancet Neurol 2025;24:850 (2024 tahriri).',
  },
} satisfies Record<string, L10n>

const AREA_COLOR: Record<McArea | 'deep', string> = { pv: '#64d2ff', ctx: '#bf5af2', it: '#ffd60a', sc: '#30d158', on: '#ff9f0a', deep: '#8e8e93' }
export const TIMES = [0, 1, 3, 6, 12, 24]

/** Time and enhancement of the active lesion (shown under its radius). */
export function FocusTime({ f, set }: { f: FocalLesion; set: (f: FocalLesion) => void }) {
  const l = useL()
  return (
    <>
      <h4>
        <Clock size={11} /> {l(TX.at)}
      </h4>
      <div className="lz-chips">
        {TIMES.map((t) => (
          <button key={t} className={(f.t ?? 0) === t ? 'on' : ''} onClick={() => set({ ...f, t })}>
            {t} {l(TX.month)}
          </button>
        ))}
        <button className={`mc-gd ${f.gd ? 'on' : ''}`} onClick={() => set({ ...f, gd: !f.gd })} aria-pressed={!!f.gd}>
          {l(TX.gd)}
        </button>
      </div>
    </>
  )
}

/**
 * The PhD layer of the free lesions: a time axis to play the lesions in
 * order, and the McDonald criteria (2017 and 2024) read off them.
 */
export function McDonaldPanel({
  foci,
  set$,
  now,
  setNow,
  active,
  setActive,
}: {
  foci: FocalLesion[]
  set$: FocalSet
  now: number | null
  setNow: (t: number | null) => void
  active: number
  setActive: (i: number) => void
}) {
  const l = useL()
  const [extra, setExtra] = useState<McExtra>(NO_EXTRA)
  const mc = useMemo(() => mcdonald(foci, set$.each, extra), [foci, set$, extra])
  const maxT = Math.max(24, ...foci.map((f) => f.t ?? 0))
  const W = 300
  const X = (t: number) => 14 + (Math.sqrt(t) / Math.sqrt(maxT)) * (W - 28)
  const toggle = (k: keyof McExtra) => setExtra({ ...extra, [k]: !extra[k] })
  const has = new Set(mc.areas2024)
  const ditText = { gd: TX.ditGd, new: TX.ditNew, csf: TX.ditCsf, attacks: TX.ditAttacks }
  const area = (i: number) => mc.lesions.find((x) => x.i === i)?.area
  // Lesions on the same time stack upwards on the axis.
  const stack = new Map<number, number>()
  const countAt = new Map<number, number>()
  for (const f of foci) countAt.set(f.t ?? 0, (countAt.get(f.t ?? 0) ?? 0) + 1)
  const top = 33 - 18 * (Math.max(1, ...countAt.values()) - 1) - 12

  return (
    <div className="mc">
      <h4>{l(TX.title)}</h4>
      <div className="mc-axis">
        <svg viewBox={`0 ${top} ${W} ${56 - top}`} role="img" aria-label={l(TX.axis)}>
          <line x1={14} x2={W - 14} y1={44} y2={44} className="mc-base" />
          {TIMES.filter((t) => t <= maxT).map((t) => (
            <g key={t} className="mc-tick" onClick={() => setNow(t)}>
              <line x1={X(t)} x2={X(t)} y1={41} y2={47} />
              <text x={X(t)} y={55}>
                {t}
              </text>
              <rect x={X(t) - 9} y={top} width={18} height={56 - top} />
            </g>
          ))}
          {now !== null && <line x1={X(now)} x2={X(now)} y1={top} y2={44} className="mc-now" />}
          {foci.map((f, i) => {
            const t = f.t ?? 0
            const k = stack.get(t) ?? 0
            stack.set(t, k + 1)
            const a = area(i) ?? 'deep'
            const hidden = now !== null && t > now
            const sym = mc.lesions.find((x) => x.i === i)?.symptomatic
            return (
              <g
                key={i}
                className={`mc-dot ${i === active ? 'on' : ''} ${hidden ? 'later' : ''}`}
                onClick={() => setActive(i)}
                style={{ '--c': AREA_COLOR[a] } as React.CSSProperties}
              >
                <circle cx={X(t)} cy={33 - k * 18} r={6} className={sym ? 'sym' : ''} />
                {f.gd && <circle cx={X(t)} cy={33 - k * 18} r={8.5} className="gd" />}
                <text x={X(t)} y={36 - k * 18}>
                  {i + 1}
                </text>
              </g>
            )
          })}
        </svg>
        {/* Play the lesions in order: the last stop shows them all. */}
        <label className="mc-scrub">
          <span>
            {l(TX.axis)} · <b>{now === null ? l(TX.all) : `${now} ${l(TX.month)}`}</b>
          </span>
          <input
            className="lz-range"
            type="range"
            min={0}
            max={TIMES.length}
            step={1}
            value={now === null ? TIMES.length : Math.max(0, TIMES.indexOf(now))}
            onChange={(e) => {
              const k = Number(e.target.value)
              setNow(k >= TIMES.length ? null : TIMES[k])
            }}
          />
        </label>
      </div>

      {foci[active] && now !== null && (foci[active].t ?? 0) > now && <p className="sv-hint">{l(TX.later)}</p>}
      {mc.lesions.some((x) => !x.counts) && <p className="sv-hint">{l(TX.small).replace('{mm}', String(MIN_DIAMETER_MM))}</p>}

      <h4>{l(TX.areas)}</h4>
      <div className="mc-areas">
        {MC_AREAS.map((a) => (
          <div key={a.id} className={`mc-area ${has.has(a.id) ? 'on' : ''}`} style={{ '--c': AREA_COLOR[a.id] } as React.CSSProperties}>
            <i />
            <span>
              {l(a.name)}
              {!a.v2017 && <small> · 2024</small>}
            </span>
            <b>
              {mc.lesions
                .filter((x) => x.area === a.id && x.counts)
                .map((x) => x.i + 1)
                .join(' ')}
            </b>
          </div>
        ))}
        {mc.lesions.some((x) => x.area === 'deep') && (
          <div className="mc-area" style={{ '--c': AREA_COLOR.deep } as React.CSSProperties}>
            <i />
            <span>{l(TX.deep)}</span>
            <b>
              {mc.lesions
                .filter((x) => x.area === 'deep')
                .map((x) => x.i + 1)
                .join(' ')}
            </b>
          </div>
        )}
      </div>

      <h4>{l(TX.outside)}</h4>
      <div className="lz-chips">
        {(['cord', 'cortex', 'optic', 'opticAttack', 'csf', 'cvs'] as const).map((k) => (
          <button key={k} className={extra[k] ? 'on' : ''} onClick={() => toggle(k)} aria-pressed={extra[k]}>
            {l(TX[k])}
          </button>
        ))}
      </div>

      <div className="lz-table mc-verdict">
        <div className={`lz-row ${mc.attacks ? 'hit' : 'spared'}`} style={{ '--c': '#ff6b61' } as React.CSSProperties}>
          <i />
          <span className="lz-mod">
            <b>{l(TX.attacks)}</b>
            <small>
              {mc.clinical} {l(TX.clinical)}
            </small>
          </span>
          <span className="lz-res">{mc.attacks}</span>
        </div>
        <Row ok={mc.dis2017} name={l(TX.dis)} detail={mc.areas2017.map((a) => l(MC_AREAS.find((x) => x.id === a)!.name)).join(', ')} res={`${mc.areas2017.length}/4`} />
        <Row ok={mc.dit.length > 0} name={l(TX.dit)} detail={mc.dit.map((d) => l(ditText[d])).join(', ')} res={mc.dit.length ? '✓' : '—'} />
      </div>

      <Verdict year="2017" ms={mc.v2017.ms} need={mc.v2017.need.map((n) => l(n === 'dis' ? TX.needDis : n === 'dit' ? TX.needDit : TX.needAttack))} l={l} />
      <Verdict year={`2024 · ${mc.areas2024.length}/5`} ms={mc.v2024.ms} need={mc.v2024.need.map((n) => l(n === 'dis' ? TX.needDis : TX.needSupport))} l={l} />
      {mc.v2017.ris && <p className="sv-note">{l(TX.ris)}</p>}
      {mc.flags.map((f) => (
        <p key={f} className="sv-note lz-crossed">
          {l(TX[f])}
        </p>
      ))}
      <p className="sv-note">{l(TX.plate)}</p>
      <p className="sv-note mc-ref">{l(TX.ref)}</p>
    </div>
  )
}

function Row({ ok, name, detail, res }: { ok: boolean; name: string; detail: string; res: string }) {
  return (
    <div className={`lz-row ${ok ? 'hit' : 'spared'}`} style={{ '--c': ok ? '#30d158' : '#8e8e93' } as React.CSSProperties}>
      <i />
      <span className="lz-mod">
        <b>{name}</b>
        {detail && <small>{detail}</small>}
      </span>
      <span className="lz-res">{res}</span>
    </div>
  )
}

function Verdict({ year, ms, need, l }: { year: string; ms: boolean; need: string[]; l: (x: L10n) => string }) {
  return (
    <div className={`mc-verdict-line ${ms ? 'ok' : ''}`}>
      {ms ? <Check size={13} /> : <X size={13} />}
      <span>
        <b>McDonald {year}:</b> {ms ? l(TX.ms) : l(TX.notYet) + need.join('; ')}
      </span>
    </div>
  )
}
