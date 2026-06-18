import { describe, expect, it } from 'vitest'
import { createCoachCounter, type HoldConfig, type RepConfig } from './repCounter'
import type { Landmark } from './geometry'

// Config "proxy" : l'angle suivi est simplement la coordonnée x du 1er point,
// ce qui permet de piloter la machine à états directement.
const repConfig: RepConfig = {
  mode: 'reps',
  visibilityPoints: [0],
  minVisibility: 0.5,
  metric: (lm) => lm[0].x,
  downThreshold: 95,
  upThreshold: 155,
}

function frame(value: number, visibility = 1): Landmark[] {
  return [{ x: value, y: 0, visibility }]
}

describe('compteur de répétitions', () => {
  it('compte un cycle haut -> bas -> haut comme 1 rep', () => {
    const c = createCoachCounter(repConfig)
    c.update(frame(170)) // haut
    c.update(frame(80)) // bas
    const r = c.update(frame(170)) // remonte -> 1 rep
    expect(r.kind).toBe('reps')
    if (r.kind === 'reps') {
      expect(r.reps).toBe(1)
      expect(r.phase).toBe('up')
    }
  })

  it('compte plusieurs reps et ignore les mouvements partiels', () => {
    const c = createCoachCounter(repConfig)
    const seq = [170, 80, 170, 120, 170, 80, 160] // 2 vraies reps ; le 120 ne passe pas sous 95
    let last
    for (const v of seq) last = c.update(frame(v))
    expect(last && last.kind === 'reps' && last.reps).toBe(2)
  })

  it("ne double-compte pas autour du seuil (hystérésis)", () => {
    const c = createCoachCounter(repConfig)
    // descend une fois, puis oscille juste sous le seuil haut sans le franchir
    for (const v of [170, 80, 150, 100, 150, 100]) c.update(frame(v))
    const r = c.update(frame(150))
    expect(r.kind === 'reps' && r.reps).toBe(0)
  })

  it('ne compte pas quand la visibilité est trop faible', () => {
    const c = createCoachCounter(repConfig)
    const r = c.update(frame(80, 0.1))
    expect(r.lowVisibility).toBe(true)
    expect(r.kind === 'reps' && r.reps).toBe(0)
  })

  it('reset remet le compteur à zéro', () => {
    const c = createCoachCounter(repConfig)
    c.update(frame(170))
    c.update(frame(80))
    c.update(frame(170))
    c.reset()
    const r = c.update(frame(170))
    expect(r.kind === 'reps' && r.reps).toBe(0)
  })
})

const holdConfig: HoldConfig = {
  mode: 'hold',
  visibilityPoints: [0],
  minVisibility: 0.5,
  inPosition: (lm) => lm[0].x > 0.5,
}

describe('compteur de maintien (gainage)', () => {
  it('cumule le temps uniquement en position', () => {
    const c = createCoachCounter(holdConfig)
    c.update([{ x: 1, y: 0, visibility: 1 }], 1000) // en position +1s
    c.update([{ x: 0, y: 0, visibility: 1 }], 1000) // hors position : pas de cumul
    const r = c.update([{ x: 1, y: 0, visibility: 1 }], 500) // +0.5s
    expect(r.kind).toBe('hold')
    expect(r.kind === 'hold' && r.heldMs).toBe(1500)
  })

  it('ne cumule pas quand la visibilité est trop faible', () => {
    const c = createCoachCounter(holdConfig)
    const r = c.update([{ x: 1, y: 0, visibility: 0.2 }], 1000)
    expect(r.lowVisibility).toBe(true)
    expect(r.kind === 'hold' && r.heldMs).toBe(0)
  })
})
