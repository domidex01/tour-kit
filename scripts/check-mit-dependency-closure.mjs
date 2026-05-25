#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const repoRoot = process.cwd()
const packagesDir = join(repoRoot, 'packages')

const workspacePackages = new Map()

for (const dirent of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!dirent.isDirectory()) continue

  const manifestPath = join(packagesDir, dirent.name, 'package.json')
  if (!existsSync(manifestPath)) continue

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (manifest.private === true || typeof manifest.name !== 'string') continue

  workspacePackages.set(manifest.name, {
    dir: dirent.name,
    manifest,
    manifestPath,
  })
}

function isMitPackage(pkg) {
  return pkg.manifest.license === 'MIT'
}

function workspaceEdges(pkg) {
  const edges = []
  const dependencies = pkg.manifest.dependencies ?? {}

  for (const depName of Object.keys(dependencies)) {
    if (workspacePackages.has(depName)) {
      edges.push({ name: depName, kind: 'dependency' })
    }
  }

  const peers = pkg.manifest.peerDependencies ?? {}
  const peerMeta = pkg.manifest.peerDependenciesMeta ?? {}

  for (const peerName of Object.keys(peers)) {
    if (!workspacePackages.has(peerName)) continue
    if (peerMeta[peerName]?.optional === true) continue
    edges.push({ name: peerName, kind: 'required peer' })
  }

  return edges
}

function findNonMitPaths(rootName) {
  const paths = []
  const stack = workspaceEdges(workspacePackages.get(rootName)).map((edge) => ({
    edge,
    path: [rootName, edge.name],
    edgeKinds: [edge.kind],
  }))

  while (stack.length > 0) {
    const current = stack.pop()
    const currentPkg = workspacePackages.get(current.edge.name)
    if (!currentPkg) continue

    if (!isMitPackage(currentPkg)) {
      paths.push(current)
      continue
    }

    for (const edge of workspaceEdges(currentPkg)) {
      if (current.path.includes(edge.name)) continue
      stack.push({
        edge,
        path: [...current.path, edge.name],
        edgeKinds: [...current.edgeKinds, edge.kind],
      })
    }
  }

  return paths
}

const failures = []

for (const [name, pkg] of workspacePackages) {
  if (!isMitPackage(pkg)) continue

  for (const path of findNonMitPaths(name)) {
    failures.push(
      `${path.path.join(' -> ')} (${path.edgeKinds.join(' -> ')}) reaches non-MIT package`
    )
  }
}

if (failures.length > 0) {
  console.error('MIT package dependency closure check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('MIT package dependency closure check passed.')
