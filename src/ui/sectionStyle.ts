import type { L10n } from '@/data/types'
import type { SectionCategory } from '@/data/sections'

/**
 * Category colours for the cross-section figures, chosen to echo the
 * whiteboard / atlas convention (motor red, sensory blue, cranial-nerve
 * motor orange…) while staying distinct from each other on the dark card.
 */
export const CATEGORY: Record<SectionCategory, { color: string; name: L10n }> = {
  motor: { color: '#ef5350', name: { en: 'Descending motor', uz: 'Tushuvchi harakat yo\'llari' } },
  sensory: { color: '#4f8bff', name: { en: 'Ascending sensory', uz: "Ko'tariluvchi sezgi yo'llari" } },
  'cn-motor': { color: '#ff9a3c', name: { en: 'Cranial-nerve motor', uz: 'Bosh nerv harakat yadrolari' } },
  'cn-sensory': { color: '#22c1c3', name: { en: 'Cranial-nerve sensory', uz: 'Bosh nerv sezuvchi yadrolari' } },
  autonomic: { color: '#57d163', name: { en: 'Autonomic (parasympathetic)', uz: 'Vegetativ (parasimpatik)' } },
  cerebellar: { color: '#9a7bff', name: { en: 'Cerebellar system', uz: 'Miyacha tizimi' } },
  modulatory: { color: '#ff6fae', name: { en: 'Reticular / modulatory', uz: 'Retikulyar / modulyator' } },
  relay: { color: '#c9975b', name: { en: 'Relay & basal-ganglia nuclei', uz: "Bo'g'in va bazal yadrolar" } },
  hypothalamic: { color: '#ffb38a', name: { en: 'Hypothalamic', uz: 'Gipotalamik' } },
  limbic: { color: '#b8d33a', name: { en: 'Limbic', uz: 'Limbik' } },
  'visual-auditory': { color: '#ffd54f', name: { en: 'Visual & auditory', uz: "Ko'rish va eshitish" } },
  pathway: { color: '#b0bec5', name: { en: 'Other fibre systems', uz: 'Boshqa tola tizimlari' } },
  csf: { color: '#7cc6ee', name: { en: 'CSF spaces', uz: "Likvor bo'shliqlari" } },
  region: { color: '#7d8796', name: { en: 'Grey-matter regions', uz: 'Kulrang modda sohalari' } },
}

/** Drawn hatched (fibre bundles) rather than solid (nuclei). */
export const FIBRE = new Set([
  'pyramid', 'pyr-dec', 'lcst', 'basis-cst', 'crus', 'crus-fp', 'crus-cst', 'crus-ptop', 'rst', 'tst', 'fg', 'fc', 'ia', 'ml', 'als', 'tl', 'll', 'dsct', 'vsct',
  'sp5t', 'mes5', 'icp', 'mcp', 'scp', 'scp-dec', 'tpf', 'tb', 'bic', 'bsc', 'pc', 'mlf', 'ctt', 'vtd', 'dtd', 'n4-dec', 'th-iml', 'th-eml', 'sm', 'ic3', 'fx', 'mtt',
  'och', 'ot', 'ac', 'cca', 'smv',
])

/** Display order of the categories in the list and legend. */
export const CATEGORY_ORDER: SectionCategory[] = [
  'motor', 'sensory', 'cn-motor', 'cn-sensory', 'autonomic', 'cerebellar', 'visual-auditory', 'relay', 'hypothalamic', 'limbic', 'modulatory', 'pathway', 'csf', 'region',
]
