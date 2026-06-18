import { describe, expect, it } from 'vitest'
import { POSE, angle, bestArmSide, type Landmark } from './geometry'
import { elbowAngle } from './exercises'

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
