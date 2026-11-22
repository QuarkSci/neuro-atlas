import type { HandLandmarker } from '@mediapipe/tasks-vision'
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url'
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url'
import type { HandFrame } from './types'

/**
 * Webcam → hand landmarks, entirely on this machine: the model (MediaPipe Hand
 * Landmarker, Apache-2.0) and its WASM runtime are served from our own origin,
 * and no frame ever leaves the browser.
 */
export class CameraTracker {
  readonly video: HTMLVideoElement
  private stream: MediaStream | null = null
  private landmarker: HandLandmarker | null = null
  private lastVideoTime = -1

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

    const { HandLandmarker } = await import('@mediapipe/tasks-vision')
    const fileset = { wasmLoaderPath, wasmBinaryPath }
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: `${import.meta.env.BASE_URL}models/hand_landmarker.task`, delegate },
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.5,
    })
    try {
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'))
    } catch (e) {
      console.warn('[hands] GPU delegate failed, using CPU', e)
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU'))
    }
  }

  /** Landmarks for the newest camera frame, or null when the camera has not produced a new one. */
  detect(now: number): HandFrame | null {
    const v = this.video
    if (!this.landmarker || v.readyState < 2 || v.currentTime === this.lastVideoTime) return null
    this.lastVideoTime = v.currentTime
    const r = this.landmarker.detectForVideo(v, now)
    return {
      aspect: v.videoWidth / Math.max(1, v.videoHeight),
      time: now,
      hands: r.landmarks.map((image, i) => ({
        side: r.handedness[i]?.[0]?.categoryName === 'Left' ? 'left' : 'right',
        score: r.handedness[i]?.[0]?.score ?? 0,
        image,
        world: r.worldLandmarks[i] ?? image,
      })),
    }
  }

  stop() {
    this.landmarker?.close()
    this.landmarker = null
    for (const t of this.stream?.getTracks() ?? []) t.stop()
    this.stream = null
    this.video.srcObject = null
  }
}
