import type { Lang } from '@/store/useAtlas'

/** Hand-tracking strings, kept beside the feature (the main table is shared with other work in flight). */
export const HAND_STRINGS = {
  en: {
    menu: 'Hand control (camera)',
    title: 'Hands',
    starting: 'Starting the camera…',
    noHands: 'Raise a hand in front of the camera',
    point: 'Point to see a name · quick pinch to select',
    grab: 'Turning — let go to release',
    zoom: 'Pull hands apart or together to zoom',
    preview: 'Camera picture',
    stop: 'Stop',
    privacy: 'The camera picture stays on this computer.',
    denied: 'Camera access was declined. Allow it in the browser’s site settings and try again.',
    nocam: 'No camera was found.',
    load: 'Hand tracking could not start (the model failed to load).',
    retry: 'Try again',
  },
  uz: {
    menu: "Qo'l bilan boshqarish (kamera)",
    title: "Qo'llar",
    starting: 'Kamera ishga tushmoqda…',
    noHands: "Kamera oldida qo'lingizni ko'taring",
    point: "Ko'rsating — nomi chiqadi · tez chimdish — tanlash",
    grab: "Burayapsiz — qo'yib yuborish uchun barmoqlarni oching",
    zoom: "Yaqinlashtirish: qo'llarni bir-biridan uzoqlashtiring yoki yaqinlashtiring",
    preview: 'Kamera tasviri',
    stop: "To'xtatish",
    privacy: 'Kamera tasviri shu kompyuterdan chiqmaydi.',
    denied: "Kameraga ruxsat berilmadi. Brauzerning sayt sozlamalarida ruxsat bering va qayta urinib ko'ring.",
    nocam: 'Kamera topilmadi.',
    load: "Qo'l kuzatuvi ishga tushmadi (model yuklanmadi).",
    retry: 'Qayta urinish',
  },
} satisfies Record<Lang, Record<string, string>>
