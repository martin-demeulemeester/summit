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

  it("ne compte pas tant que la position n'est pas valide (ready)", () => {
    // metric = x (angle), ready = y > 0.5 (position valide)
    const cfg = { ...repConfig, ready: (lm: Landmark[]) => lm[0].y > 0.5, readyHint: 'place-toi' }
    const c = createCoachCounter(cfg)
    const f = (x: number, y: number): Landmark[] => [{ x, y, visibility: 1 }]
    // position non valide (y=0) : aucun comptage
    c.update(f(170, 0))
    c.update(f(80, 0))
    const r1 = c.update(f(170, 0))
    expect(r1.kind === 'reps' && r1.reps).toBe(0)
    expect(r1.feedback).toContain('place-toi')
    // position valide (y=1) : un cycle compte
    c.update(f(170, 1))
    c.update(f(80, 1))
    const r2 = c.update(f(170, 1))
    expect(r2.kind === 'reps' && r2.reps).toBe(1)
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
    c.update([{ x: 1, y: 0, visibility: 1 }], undefined, 1000) // en position +1s
    c.update([{ x: 0, y: 0, visibility: 1 }], undefined, 1000) // hors position : pas de cumul
    const r = c.update([{ x: 1, y: 0, visibility: 1 }], undefined, 500) // +0.5s
    expect(r.kind).toBe('hold')
    expect(r.kind === 'hold' && r.heldMs).toBe(1500)
  })

  it('ne cumule pas quand la visibilité est trop faible', () => {
    const c = createCoachCounter(holdConfig)
    const r = c.update([{ x: 1, y: 0, visibility: 0.2 }], undefined, 1000)
    expect(r.lowVisibility).toBe(true)
    expect(r.kind === 'hold' && r.heldMs).toBe(0)
  })
})
