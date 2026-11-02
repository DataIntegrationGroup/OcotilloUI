import { getTheme } from '../src/theme'
import { writeFileSync } from 'node:fs'
const snap = { light: getTheme('light'), dark: getTheme('dark') }
writeFileSync('src/test/theme/__fixtures__/theme-baseline.json', JSON.stringify(snap, null, 2))
console.log('Captured theme snapshot to src/test/theme/__fixtures__/theme-baseline.json')
