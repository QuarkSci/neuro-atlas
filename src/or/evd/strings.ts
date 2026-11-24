/**
 * Bilingual UI strings (uz / en) for the OP-1 EVD simulator panel (AG-15).
 */
import type { Lang } from '@/store/useAtlas'
import type { EvdMetricScores } from './types'

export interface EvdStrings {
  title: string
  tabProcedure: string
  tabHistory: string
  tabReference: string
  close: string
  // Setup
  level: string
  side: string
  sideRight: string
  sideLeft: string
  laser: string
  start: string
  reset: string
  // Active step
  stepOf: string
  mistakeLabel: string
  confirmStep: string
  // Step 1 checklist
  checkNeutral: string
  checkElevation: string
  checkCoag: string
  checkHint: string
  // Step 2 mark
  markHint: string
  markError: string
  markLateral: string
  markAhead: string
  markOnTarget: string
  markFlagSinus: string
  markFlagMotor: string
  markFlagOff: string
  markFlagSide: string
  // Catheter HUD / steps 6-8
  depthTable: string
  depthScalp: string
  distMonro: string
  angleIdeal: string
  passes: string
  csfWaiting: string
  csfFlowing: string
  nearestHazard: string
  seatBtn: string
  finishBtn: string
  // Report
  reportTitle: string
  osatsMean: string
  hardFails: string
  ghajarCompare: string
  entryError: string
  seqErrors: string
  metrics: Record<keyof EvdMetricScores, string>
  newAttempt: string
  copyCsv: string
  downloadCsv: string
  downloadTrace: string
  copied: string
  // History & learning curve
  historyEmpty: string
  sessionsCount: string
  grade1Rate: string
  bestScore: string
  curveTitle: string
  curveMetrics: {
    total: string
    angleErrDeg: string
    tipToMonroMm: string
    durationS: string
    tremorRmsMm: string
  }
  clearHistory: string
  // Reference tab
  refLandmarks: string
  refAccessPoints: string
  refComplications: string
  refSources: string
  // Events
  eventsTitle: string
  evOutOfOrder: string
  evPassStart: string
  evCsf: string
  evOvershoot: string
  evWarn: string
  evCollision: string
}

export const EVD_STRINGS: Record<Lang, EvdStrings> = {
  uz: {
    title: 'OP-1: EVD (Ventrikulostomiya)',
    tabProcedure: 'Protsedura',
    tabHistory: 'Tarix',
    tabReference: "Ma'lumot",
    close: 'Yopish',
    level: 'Daraja',
    side: 'Tomon',
    sideRight: "O'ng (standart)",
    sideLeft: 'Chap',
    laser: 'Traektoriya lazeri',
    start: 'EVD ni boshlash',
    reset: 'Qayta boshlash',
    stepOf: 'qadam',
    mistakeLabel: 'Xato oqibati',
    confirmStep: 'Qadamni tasdiqlash',
    checkNeutral: 'Bosh qat’iy neytral (burun shipga)',
    checkElevation: "Karavot boshi 30°–45° ko'tarilgan",
    checkCoag: 'Koagulogramma tekshirilgan + antibiotik berilgan',
    checkHint: 'Barcha tayyorgarlik bandlarini belgilab, tasdiqlang.',
    markHint: 'Suyak yuzasida Kocher nuqtasini belgilang.',
    markError: 'Idealdan xato',
    markLateral: "O'rta chiziqdan",
    markAhead: 'Koronar chokdan oldin',
    markOnTarget: 'Nishonda ✓',
    markFlagSinus: 'Sinus xavfi (< 20 mm)',
    markFlagMotor: "Motor po'stloq xavfi (orqada)",
    markFlagOff: 'Ideal nuqtadan uzoq',
    markFlagSide: "Noto'g'ri tomon",
    depthTable: 'Chuqurlik (suyak)',
    depthScalp: 'Chuqurlik (teri)',
    distMonro: 'Monrogacha',
    angleIdeal: 'Ideal burchak',
    passes: 'Urinishlar',
    csfWaiting: 'Likvor kutilmoqda…',
    csfFlowing: 'LIKVOR (CSF) ✓',
    nearestHazard: 'Eng yaqin xavf',
    seatBtn: "Styletni olish va o'rnatish",
    finishBtn: 'Tunnellash va hisobot',
    reportTitle: 'EVD yakuniy hisoboti',
    osatsMean: "OSATS o'rtacha",
    hardFails: 'Kritik cheklovlar',
    ghajarCompare: 'Ghajar normaliga nisbatan',
    entryError: 'Kirish nuqtasi xatosi',
    seqErrors: 'Tartib xatolari',
    metrics: {
      time: 'Vaqt (s)',
      passes: 'Urinishlar',
      angle: "Burchak og'ishi (°)",
      monro: 'Monro masofasi (mm)',
      depth: 'Chuqurlik og‘ishi (mm)',
      collisions: "To'qnashuvlar",
      tremor: 'Titrash RMS (mm)',
      efficiency: "Yo'l samaradorligi",
    },
    newAttempt: 'Yangi urinish',
    copyCsv: 'CSV nusxa',
    downloadCsv: 'CSV yuklash',
    downloadTrace: 'Traektoriya CSV',
    copied: 'Nusxalandi',
    historyEmpty: "Hali yakunlangan EVD mashg'ulotlari yo'q.",
    sessionsCount: 'Mashg‘ulotlar',
    grade1Rate: 'Kakarla 1 ulushi',
    bestScore: 'Eng yaxshi ball',
    curveTitle: "O'rganish egri chizig'i",
    curveMetrics: {
      total: 'OSATS ball (1–5)',
      angleErrDeg: 'Burchak xatosi (°)',
      tipToMonroMm: 'Monro masofasi (mm)',
      durationS: 'Vaqt (s)',
      tremorRmsMm: 'Titrash RMS (mm)',
    },
    clearHistory: 'Tarixni tozalash',
    refLandmarks: 'Kocher orientirlari (mm)',
    refAccessPoints: 'Muqobil kirish nuqtalari',
    refComplications: 'Asoratlar chastotasi',
    refSources: 'Tasdiqlangan manbalar',
    eventsTitle: 'So‘nggi hodisalar',
    evOutOfOrder: 'Tartib buzildi',
    evPassStart: 'Urinish boshlandi',
    evCsf: 'Likvor (CSF) olindi',
    evOvershoot: 'Chuqurlik > 70 mm!',
    evWarn: 'Yaqinlik ogohlantirishi',
    evCollision: "To'qnashuv",
  },
  en: {
    title: 'OP-1: EVD (Ventriculostomy)',
    tabProcedure: 'Procedure',
    tabHistory: 'History',
    tabReference: 'Reference',
    close: 'Close',
    level: 'Level',
    side: 'Side',
    sideRight: 'Right (standard)',
    sideLeft: 'Left',
    laser: 'Trajectory laser',
    start: 'Start EVD',
    reset: 'Reset',
    stepOf: 'step',
    mistakeLabel: 'If wrong',
    confirmStep: 'Confirm step',
    checkNeutral: 'Head strictly neutral (nose to ceiling)',
    checkElevation: 'Head of bed elevated 30°–45°',
    checkCoag: 'Coagulation checked + antibiotic given',
    checkHint: 'Check all preparation items, then confirm.',
    markHint: 'Place the Kocher point mark on the skull surface.',
    markError: 'Error from ideal',
    markLateral: 'From midline',
    markAhead: 'Anterior to coronal',
    markOnTarget: 'On target ✓',
    markFlagSinus: 'Sinus risk (< 20 mm)',
    markFlagMotor: 'Motor cortex risk (posterior)',
    markFlagOff: 'Off ideal point',
    markFlagSide: 'Wrong side',
    depthTable: 'Depth (outer table)',
    depthScalp: 'Depth (scalp)',
    distMonro: 'To Monro',
    angleIdeal: 'Angle to ideal',
    passes: 'Passes',
    csfWaiting: 'Awaiting CSF…',
    csfFlowing: 'CSF FLOW ✓',
    nearestHazard: 'Nearest hazard',
    seatBtn: 'Withdraw stylet & seat',
    finishBtn: 'Tunnel & report',
    reportTitle: 'EVD final report',
    osatsMean: 'OSATS mean',
    hardFails: 'Critical caps',
    ghajarCompare: 'Angle vs Ghajar normal',
    entryError: 'Entry point error',
    seqErrors: 'Sequence errors',
    metrics: {
      time: 'Duration (s)',
      passes: 'Passes',
      angle: 'Angle error (°)',
      monro: 'Tip to Monro (mm)',
      depth: 'Depth deviation (mm)',
      collisions: 'Collisions',
      tremor: 'Tremor RMS (mm)',
      efficiency: 'Path efficiency',
    },
    newAttempt: 'New attempt',
    copyCsv: 'Copy CSV',
    downloadCsv: 'Download CSV',
    downloadTrace: 'Trace CSV',
    copied: 'Copied',
    historyEmpty: 'No completed EVD sessions yet.',
    sessionsCount: 'Sessions',
    grade1Rate: 'Kakarla 1 rate',
    bestScore: 'Best score',
    curveTitle: 'Learning curve',
    curveMetrics: {
      total: 'OSATS score (1–5)',
      angleErrDeg: 'Angle error (°)',
      tipToMonroMm: 'Tip to Monro (mm)',
      durationS: 'Duration (s)',
      tremorRmsMm: 'Tremor RMS (mm)',
    },
    clearHistory: 'Clear history',
    refLandmarks: 'Kocher landmarks (mm)',
    refAccessPoints: 'Alternative access points',
    refComplications: 'Complication rates',
    refSources: 'Verified references',
    eventsTitle: 'Recent events',
    evOutOfOrder: 'Out of order',
    evPassStart: 'Pass started',
    evCsf: 'CSF egress',
    evOvershoot: 'Overshoot > 70 mm!',
    evWarn: 'Proximity warning',
    evCollision: 'Collision',
  },
}
