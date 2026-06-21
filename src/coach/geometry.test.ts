import { describe, expect, it } from 'vitest'
import { POSE, angle, bestArmSide, isHorizontalBody3d, isVerticalBody3d, type Landmark } from './geometry'
import { chinAboveHandsGap, elbowAngle, isBodyHorizontal, isBodyVertical } from './exercises'

function emptyPose(): Landmark[] {
  return Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }))
}

describe('angle', () => {
  it('mesure 90° pour un angle droit', () => {
    expect(angle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(90, 1)
  })
  it('mesure 180° pour trois points alignés', () => {
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180, 1)
  })
})

describe('elbowAngle', () => {
  it('≈180° bras tendu, ≈90° bras fléchi (côté le mieux visible)', () => {
    const straight = emptyPose()
    // côté gauche visible
    straight[POSE.leftShoulder] = { x: 0, y: 0, visibility: 1 }
    straight[POSE.leftElbow] = { x: 0, y: 0.2, visibility: 1 }
    straight[POSE.leftWrist] = { x: 0, y: 0.4, visibility: 1 }
    expect(bestArmSide(straight)).toBe('left')
    expect(elbowAngle(straight)).toBeCloseTo(180, 0)

    const bent = emptyPose()
    bent[POSE.leftShoulder] = { x: 0, y: 0, visibility: 1 }
    bent[POSE.leftElbow] = { x: 0, y: 0.2, visibility: 1 }
    bent[POSE.leftWrist] = { x: 0.2, y: 0.2, visibility: 1 }
    expect(elbowAngle(bent)).toBeCloseTo(90, 0)
  })
})

describe('orientation du corps', () => {
  it('distingue debout (vertical) et planche (horizontal)', () => {
    const standing = emptyPose()
    standing[POSE.leftShoulder] = { x: 0.5, y: 0.2, visibility: 1 }
    standing[POSE.leftAnkle] = { x: 0.5, y: 0.9, visibility: 1 }
    expect(isBodyVertical(standing)).toBe(true)
    expect(isBodyHorizontal(standing)).toBe(false)

    const plank = emptyPose()
    plank[POSE.leftShoulder] = { x: 0.2, y: 0.5, visibility: 1 }
    plank[POSE.leftAnkle] = { x: 0.9, y: 0.55, visibility: 1 }
    expect(isBodyHorizontal(plank)).toBe(true)
    expect(isBodyVertical(plank)).toBe(false)
  })
})

describe('orientation 3D (world landmarks, profondeur incluse)', () => {
  it('planche de face : corps étendu en profondeur (z) → horizontal', () => {
    const w = emptyPose()
    w[POSE.leftShoulder] = { x: -0.1, y: 0, z: 0 }
    w[POSE.rightShoulder] = { x: 0.1, y: 0, z: 0 }
    w[POSE.leftAnkle] = { x: -0.1, y: 0.02, z: 1.2 }
    w[POSE.rightAnkle] = { x: 0.1, y: 0.02, z: 1.2 }
    expect(isHorizontalBody3d(w)).toBe(true)
    expect(isVerticalBody3d(w)).toBe(false)
  })

  it('debout : corps étendu en hauteur (y) → vertical', () => {
    const w = emptyPose()
    w[POSE.leftShoulder] = { x: -0.1, y: 0, z: 0 }
    w[POSE.rightShoulder] = { x: 0.1, y: 0, z: 0 }
    w[POSE.leftAnkle] = { x: -0.1, y: 1.2, z: 0.02 }
    w[POSE.rightAnkle] = { x: 0.1, y: 1.2, z: 0.02 }
    expect(isVerticalBody3d(w)).toBe(true)
    expect(isHorizontalBody3d(w)).toBe(false)
  })
})

describe('chinAboveHandsGap (tractions)', () => {
  it('positif en suspension (nez sous les mains), négatif menton au-dessus', () => {
    const hanging = emptyPose()
    hanging[POSE.nose] = { x: 0.5, y: 0.4, visibility: 1 } // nez plus bas (y grand)
    hanging[POSE.leftWrist] = { x: 0.4, y: 0.2, visibility: 1 } // mains plus haut (y petit)
    hanging[POSE.rightWrist] = { x: 0.6, y: 0.2, visibility: 1 }
    expect(chinAboveHandsGap(hanging)).toBeGreaterThan(0)

    const chinUp = emptyPose()
    chinUp[POSE.nose] = { x: 0.5, y: 0.18, visibility: 1 } // nez au-dessus des mains
    chinUp[POSE.leftWrist] = { x: 0.4, y: 0.2, visibility: 1 }
    chinUp[POSE.rightWrist] = { x: 0.6, y: 0.2, visibility: 1 }
    expect(chinAboveHandsGap(chinUp)).toBeLessThan(0)
  })
})
