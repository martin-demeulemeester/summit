import pkg from '../package.json'

// Source de vérité unique pour la version (SemVer), lue depuis package.json.
export const APP_VERSION: string = pkg.version
