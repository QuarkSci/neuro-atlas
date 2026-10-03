import { BRAINSTEM_STRUCTURES } from './structures-brainstem'
import { FOREBRAIN_STRUCTURES } from './structures-forebrain'
import { GROUND_STRUCTURES } from './structures-ground'
import type { StructureInfo } from './types'

/** Every structure any section draws, keyed by the id the sections use. */
export const STRUCTURES: Record<string, StructureInfo> = { ...BRAINSTEM_STRUCTURES, ...FOREBRAIN_STRUCTURES, ...GROUND_STRUCTURES }
