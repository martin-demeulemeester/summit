import { ProgressBar } from 'summit'

export const Vide = () => (
  <div style={{ padding: 20, maxWidth: 360 }}>
    <ProgressBar value={0} max={9} />
  </div>
)

export const EnCours = () => (
  <div style={{ padding: 20, maxWidth: 360 }}>
    <ProgressBar value={5} max={9} />
  </div>
)

export const Complet = () => (
  <div style={{ padding: 20, maxWidth: 360 }}>
    <ProgressBar value={9} max={9} />
  </div>
)
