/** One tracked point. Image points are normalised to the camera frame (0..1, y down); world points are metres around the hand's centre. */
export interface Pt {
  x: number
  y: number
  z: number
}

export interface TrackedHand {
  /** The person's own hand (MediaPipe reports it for the un-mirrored frame). */
  side: 'left' | 'right'
  image: Pt[]
  world: Pt[]
  score: number
}

export interface HandFrame {
  hands: TrackedHand[]
  /** Camera frame aspect (width / height), needed to map image points onto the screen. */
  aspect: number
  /** ms, performance.now() clock. */
  time: number
}

/** MediaPipe hand landmark indices. */
export const WRIST = 0
export const THUMB_TIP = 4
export const INDEX_MCP = 5
export const INDEX_TIP = 8
export const MIDDLE_MCP = 9
export const PINKY_MCP = 17

/** Finger chains (wrist → tip) for drawing the bones. */
export const BONES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
]

/** Palm polygon, filled so the hand reads as a hand rather than a wire skeleton. */
export const PALM = [0, 1, 5, 9, 13, 17]

export const TIPS = [4, 8, 12, 16, 20]
