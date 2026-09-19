import type { L10n, Part, Source } from '../types'
import brain from './gross-brain.json'
import vessels from './gross-vessels.json'
import julichGroups from './julich-groups.json'
import brodmann from './brodmann.json'

/**
 * One entry per concept (a left/right pair shares it). Text is written for
 * students meeting the structure for the first time and every entry cites
 * the open references it was checked against.
 */
export interface ContentEntry {
  la?: string
  description: L10n
  role?: L10n
  clinical?: L10n
  sources: Source[]
}

type ContentFile = Record<string, ContentEntry>
const FILES: ContentFile[] = [brain as ContentFile, vessels as ContentFile, julichGroups as ContentFile, brodmann as ContentFile]
const BY_CONCEPT = new Map<string, ContentEntry>()
for (const f of FILES) for (const [k, v] of Object.entries(f)) BY_CONCEPT.set(k, v)

/**
 * Structures with no entry of their own inherit a family entry: a cortical
 * branch of the middle cerebral artery reads the MCA entry, a Julich area
 * its nucleus/gyrus group. Tried in order; first match wins.
 */
const FAMILIES: [RegExp, string][] = [
  [/middle cerebral artery|artery of .*(central|precentral|postcentral) sulcus|temporal branch|temporo-occipital|prefrontal artery|frontobasal artery|parietal artery|angular gyrus|polar temporal|anterolateral central/i, 'trunk-of-right-middle-cerebral-artery'],
  [/anterior cerebral artery|pericallosal|callosomarginal|paracentral branch|precuneal|medial striate|median commissural|splenial artery/i, 'anterior-cerebral-artery'],
  [/posterior cerebral artery|calcarine artery|collicular|posteromedial central|posterolateral central|thalamogeniculate|thalamoperforating|posterior medial choroidal/i, 'postcommunicating-part-of-right-posterior-cerebral-artery'],
  [/posterior communicating|hypothalamic branch|chiasmatic branch|mammillary artery|thalamotuberal/i, 'posterior-communicating-artery'],
  [/anterior choroidal/i, 'anterior-choroidal-artery'],
  [/superior cerebellar artery|superior vermian/i, 'superior-cerebellar-artery'],
  [/posterior inferior cerebellar/i, 'posterior-inferior-cerebellar-artery'],
  [/pontine artery/i, 'trunk-of-basilar-artery'],
  [/internal carotid|cavernous branch|clivus branch|tentorial .* branch|hypophyseal artery|meningeal branch of cavernous/i, 'trunk-of-right-internal-carotid-artery'],
  [/ophthalmic artery/i, 'ophthalmic-artery'],
  [/vertebral artery/i, 'trunk-of-left-vertebral-artery'],
  [/middle meningeal|posterior meningeal|pterygomeningeal|recurrent meningeal/i, 'trunk-of-right-middle-meningeal-artery'],
  [/medullary vein|pontine vein|cerebellar vein|vein of vermis|interpeduncular vein|precentral cerebellar/i, 'set-of-inferior-veins-of-cerebellar-hemisphere'],
  [/internal cerebral vein|septum pellucidum|thalamostriate|caudate nucleus|basal vein|deep middle cerebral/i, 'internal-cerebral-vein'],
  [/superficial middle cerebral vein|superior cerebral vein|inferior cerebral vein|anterior cerebral vein/i, 'superior-cerebral-vein'],
  [/intercavernous|cavernous sinus/i, 'cavernous-sinus'],
  [/petrosal sinus/i, 'superior-petrosal-sinus'],
  [/jugular/i, 'internal-jugular-vein'],
  [/ophthalmic vein/i, 'superior-ophthalmic-vein'],
  [/tentorium/i, 'tentorium-cerebelli'],
  [/dura mater/i, 'cerebral-hemisphere-segment-of-dura-mater'],
  [/choroid plexus/i, 'choroid-plexus-of-cerebral-hemisphere'],
  [/brachium of .* superior colliculus/i, 'superior-colliculus'],
  [/brachium of .* inferior colliculus/i, 'inferior-colliculus'],
  [/facial nerve/i, 'trunk-of-left-facial-nerve'],
  [/vagus nerve/i, 'trunk-of-left-vagus-nerve'],
  [/accessory nerve/i, 'trunk-of-left-accessory-nerve'],
  [/hypoglossal nerve/i, 'trunk-of-left-hypoglossal-nerve'],
  [/oculomotor nerve/i, 'trunk-of-left-oculomotor-nerve'],
  [/trigeminal nerve|ophthalmic nerve|maxillary nerve|mandibular nerve/i, 'trunk-of-left-trigeminal-nerve'],
]

export interface Resolved {
  entry: ContentEntry
  /** True when the text describes the family/group rather than this exact structure. */
  inherited: boolean
}

export function contentFor(part: Part, parentConcept?: string): Resolved | undefined {
  const own = BY_CONCEPT.get(part.concept)
  if (own) return { entry: own, inherited: false }
  if (parentConcept) {
    const group = BY_CONCEPT.get(parentConcept)
    if (group) return { entry: group, inherited: true }
  }
  for (const [re, id] of FAMILIES) {
    if (re.test(part.name.en)) {
      const fam = BY_CONCEPT.get(id)
      if (fam) return { entry: fam, inherited: true }
    }
  }
  return undefined
}
