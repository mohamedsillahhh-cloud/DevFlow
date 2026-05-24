export function getWorkspaceSection(pathname: string, basePath: string, fallback: string) {
  if (!pathname.startsWith(basePath)) {
    return fallback
  }

  const remainder = pathname.slice(basePath.length).replace(/^\/+|\/+$/g, '')
  const section = remainder.split('/')[0]

  return section || fallback
}
