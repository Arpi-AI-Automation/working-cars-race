/** Public-folder URL that respects Vite's `base` (GitHub Pages project path). */
export const asset = (path: string): string => {
  const base = import.meta.env.BASE_URL
  const clean = path.replace(/^\//, '')
  return `${base}${clean}`
}
