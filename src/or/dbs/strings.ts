/**
 * Bilingual UI strings (uz / en) for the OP-2 DBS simulator & MER audio module (AG-16).
 */
import type { Lang } from '@/store/useAtlas'
import type { MerResponse } from './types'

export interface DbsStrings {
  title: string
  target: string
  side: string
  sideRight: string
  sideLeft: string
  acpcFrame: string
  mniFrame: string
  grossFrame: string
  atlasOffset: string
  // Microdrive & MER
  merTitle: string
  depthLabel: string
  rateLabel: string
  layerLabel: string
  inTarget: string
  outsideTarget: string
  audioPlay: string
  audioStop: string
  audioMute: string
  audioVolume: string
  provokeBtn: string
  markEntry: string
  markExit: string
  responses: Record<MerResponse, string>
  // Macrostimulation
  macroTitle: string
  currentMa: string
  benefitAt: string
  sideEffectAt: string
  therapeuticWindow: string
  benGunShift: string
  // Scoring & export
  radialError: string
  clearance: string
  merError: string
  tracks: string
  exportCoords: string
  copied: string
  // Reference sections
  refTargets: string
  refMerTable: string
  refStimEffects: string
  refComplications: string
  refSources: string
}

export const DBS_STRINGS: Record<Lang, DbsStrings> = {
  uz: {
    title: 'OP-2: DBS (Miya chuqur stimulyatsiyasi)',
    target: 'Nishon',
    side: 'Tomon',
    sideRight: "O'ng",
    sideLeft: 'Chap',
    acpcFrame: 'AC–PC (MCP dan mm)',
    mniFrame: 'MNI ICBM152 (Julich)',
    grossFrame: 'BodyParts3D (gross)',
    atlasOffset: 'Atlaslararo farq',
    merTitle: 'Mikrodrayv va MER',
    depthLabel: 'Chuqurlik (nishonga nisbatan)',
    rateLabel: 'Razryad chastotasi',
    layerLabel: 'Joriy qatlam',
    inTarget: 'NISHON ICHIDA ✓',
    outsideTarget: 'Nishondan tashqarida',
    audioPlay: 'MER tovushini yoqish',
    audioStop: "MER tovushini o'chirish",
    audioMute: 'Ovozsiz',
    audioVolume: 'Ovoz balandligi',
    provokeBtn: 'Sinov (harakat / teginish / chaqnash)',
    markEntry: 'Kirish chegarasini belgilash',
    markExit: 'Chiqish chegarasini belgilash',
    responses: {
      none: "Javob yo'q",
      weak: 'Sust javob',
      kinesthetic: 'Kuchli kinestetik (passiv harakat)',
      voluntary: 'Ixtiyoriy harakatga bog‘liq',
      tactile: 'Taktil (yengil teri teginishi)',
      'visual-flash': 'Vizual chaqnash (strobe)',
    },
    macroTitle: 'Makrostimulyatsiya (130 Hz, 60–90 µs)',
    currentMa: 'Oqim kuchi (mA)',
    benefitAt: 'Klinik foyda chegarasi',
    sideEffectAt: "Nojo'ya ta'sir chegarasi",
    therapeuticWindow: 'Terapevtik oyna',
    benGunShift: 'Ben-Gun 2 mm siljitish',
    radialError: 'Radial xato (mm)',
    clearance: 'Traektoriya zaxirasi (mm)',
    merError: 'MER chegara xatosi (mm)',
    tracks: "MER yo'llari soni",
    exportCoords: 'Koordinata CSV',
    copied: 'Nusxalandi',
    refTargets: 'AC–PC nishon koordinatalari',
    refMerTable: 'MER elektrofiziologik qatlamlari',
    refStimEffects: "Makrostimulyatsiya nojo'ya ta'sirlari",
    refComplications: 'Asoratlar chastotasi',
    refSources: 'Tasdiqlangan manbalar',
  },
  en: {
    title: 'OP-2: DBS (Deep Brain Stimulation)',
    target: 'Target',
    side: 'Side',
    sideRight: 'Right',
    sideLeft: 'Left',
    acpcFrame: 'AC–PC (mm from MCP)',
    mniFrame: 'MNI ICBM152 (Julich)',
    grossFrame: 'BodyParts3D (gross)',
    atlasOffset: 'Cross-atlas offset',
    merTitle: 'Microdrive & MER',
    depthLabel: 'Depth (relative to target)',
    rateLabel: 'Firing rate',
    layerLabel: 'Current layer',
    inTarget: 'INSIDE TARGET ✓',
    outsideTarget: 'Outside target',
    audioPlay: 'Start MER audio',
    audioStop: 'Stop MER audio',
    audioMute: 'Mute',
    audioVolume: 'Volume',
    provokeBtn: 'Provoke (limb / touch / flash)',
    markEntry: 'Mark target entry',
    markExit: 'Mark target exit',
    responses: {
      none: 'No response',
      weak: 'Weak response',
      kinesthetic: 'Strong kinesthetic (passive movement)',
      voluntary: 'Voluntary movement-related',
      tactile: 'Tactile (light cutaneous touch)',
      'visual-flash': 'Visual strobe flash',
    },
    macroTitle: 'Macrostimulation (130 Hz, 60–90 µs)',
    currentMa: 'Current (mA)',
    benefitAt: 'Benefit threshold',
    sideEffectAt: 'Side-effect threshold',
    therapeuticWindow: 'Therapeutic window',
    benGunShift: 'Ben-Gun 2 mm offset',
    radialError: 'Radial error (mm)',
    clearance: 'Trajectory clearance (mm)',
    merError: 'MER border error (mm)',
    tracks: 'MER tracks',
    exportCoords: 'Export coordinates CSV',
    copied: 'Copied',
    refTargets: 'AC–PC target coordinates',
    refMerTable: 'MER electrophysiological layers',
    refStimEffects: 'Macrostimulation side effects',
    refComplications: 'Complication rates',
    refSources: 'Verified references',
  },
}
