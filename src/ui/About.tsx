import { useEffect } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { LAYERS } from '@/data'
import { useT } from '@/i18n'
import { useAtlas } from '@/store/useAtlas'

const MORE = [
  { title: 'siibra — EBRAINS atlas toolsuite', url: 'https://siibra-python.readthedocs.io/' },
  { title: 'Inspired by Human Atlas', url: 'https://github.com/ashemag/human-atlas' },
  { title: 'Falcon Atlas — the sister project', url: 'https://github.com/QuarkSci/falcon-atlas' },
]

export function About() {
  const t = useT()
  const { aboutOpen, setAboutOpen } = useAtlas()
  useEffect(() => {
    if (!aboutOpen) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setAboutOpen(false)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [aboutOpen, setAboutOpen])
  if (!aboutOpen) return null
  return (
    <>
      <div className="about-backdrop" onClick={() => setAboutOpen(false)} />
      <section className="about-panel glass" role="dialog" aria-modal aria-label={t.about}>
        <button className="icon-button" style={{ position: 'absolute', top: 14, right: 14 }} onClick={() => setAboutOpen(false)} aria-label={t.close}>
          <X size={18} />
        </button>
        <div className="eyebrow">{t.aboutEyebrow}</div>
        <h2>{t.aboutTitle}</h2>
        <p className="lead">{t.aboutLead}</p>
        <div className="about-copy">
          <p>{t.aboutBody1}</p>
          <p>{t.aboutBody2}</p>
          <h3>{t.aboutSources}</h3>
          {LAYERS.map((l) => (
            <a key={l.id} href={l.url} target="_blank" rel="noreferrer">
              {l.source} · {l.license} <ArrowUpRight size={14} />
            </a>
          ))}
          {MORE.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.title} <ArrowUpRight size={14} />
            </a>
          ))}
          <p className="about-credit">{t.credit}</p>
        </div>
      </section>
    </>
  )
}
