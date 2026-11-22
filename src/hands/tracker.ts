import type { FaceDetector, HandLandmarker } from '@mediapipe/tasks-vision'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'
import type { FaceObs, HandFrame } from './types'

type Vision = typeof import('@mediapipe/tasks-vision')

/** One camera frame's results. `undefined` = that task did not run on this frame. */
export interface CameraFrame {
  hands?: HandFrame
  face?: FaceObs | null
}

/**
 * Webcam → hand landmarks and/or the head position, entirely on this machine:
 * the models (MediaPipe Hand Landmarker, BlazeFace short range; Apache-2.0) and
 * the WASM runtime are served from our own origin, and no frame ever leaves the
 * browser. Each model is loaded the first time it is wanted.
 */
export class CameraTracker {
  readonly video: HTMLVideoElement
  /** Which tasks run on each new frame (set by the engine from the store). */
  wantHands = true
  wantFace = false
  private stream: MediaStream | null = null
  private vision: Vision | null = null
  private landmarker: HandLandmarker | null = null
  private face: FaceDetector | null = null
  private loading = new Set<'hands' | 'face'>()
  private lastVideoTime = -1
  private closed = false

  constructor() {
    const v = document.createElement('video')
    v.playsInline = true
    v.muted = true
    v.autoplay = true
    this.video = v
  }

  async start() {
    // Ask for the camera first: if the person declines, nothing heavy has been downloaded.
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 30 } },
      audio: false,
    })
    this.video.srcObject = this.stream
    await this.video.play()
    this.vision = await import('@mediapipe/tasks-vision')
    // Whatever is wanted now must load (a failure here is reported to the person).
    if (this.wantHands) await this.load('hands')
    if (this.wantFace) await this.load('face')
  }

  private async load(task: 'hands' | 'face') {
    if (!this.vision || this.loading.has(task) || (task === 'hands' ? this.landmarker : this.face)) return
    this.loading.add(task)
    const fileset = { wasmLoaderPath, wasmBinaryPath }
    const base = `${import.meta.env.BASE_URL}models/`
    const make = async (delegate: 'GPU' | 'CPU') => {
      const v = this.vision!
      if (task === 'hands')
        this.landmarker = await v.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: base + 'hand_landmarker.task', delegate },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.5,
        })
      else
        this.face = await v.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: base + 'blaze_face_short_range.tflite', delegate },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.6,
        })
    }
    try {
      await make('GPU')
    } catch (e) {
      console.warn(`[hands] ${task}: GPU delegate failed, using CPU`, e)
      await make('CPU')
    } finally {
      this.loading.delete(task)
    }
    if (this.closed) this.stop()
  }

  /** Results for the newest camera frame, or null when the camera has not produced a new one. */
  detect(now: number): CameraFrame | null {
    const v = this.video
    if (v.readyState < 2 || v.currentTime === this.lastVideoTime) return null
    this.lastVideoTime = v.currentTime
    const aspect = v.videoWidth / Math.max(1, v.videoHeight)
    const out: CameraFrame = {}
    if (this.wantHands) {
      if (!this.landmarker) void this.load('hands').catch((e) => console.error('[hands]', e))
      else {
        const r = this.landmarker.detectForVideo(v, now)
        out.hands = {
          aspect,
          time: now,
          hands: r.landmarks.map((image, i) => ({
            side: r.handedness[i]?.[0]?.categoryName === 'Left' ? 'left' : 'right',
            score: r.handedness[i]?.[0]?.score ?? 0,
            image,
            world: r.worldLandmarks[i] ?? image,
          })),
        }
      }
    }
    if (this.wantFace) {
      if (!this.face) void this.load('face').catch((e) => console.error('[hands]', e))
      else {
        const r = this.face.detectForVideo(v, now)
        // The nearest face (largest box) is the viewer.
        const best = r.detections.reduce<(typeof r.detections)[number] | null>((a, d) => ((d.boundingBox?.width ?? 0) > (a?.boundingBox?.width ?? -1) ? d : a), null)
        const k = best?.keypoints
        // BlazeFace keypoints: 0 right eye, 1 left eye (the person's own).
        out.face =
          k && k.length >= 2
            ? { x: (k[0].x + k[1].x) / 2, y: (k[0].y + k[1].y) / 2, iod: Math.hypot((k[0].x - k[1].x) * aspect, k[0].y - k[1].y), aspect, score: best?.categories?.[0]?.score ?? 0 }
            : null
      }
    }
    return out
  }

  stop() {
    this.closed = true
    this.landmarker?.close()
    this.face?.close()
    this.landmarker = null
    this.face = null
    for (const t of this.stream?.getTracks() ?? []) t.stop()
    this.stream = null
    this.video.srcObject = null
  }
}
