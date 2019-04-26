import path from 'path'
// fs-extra는 fs에 없는 몇 파일 시스템 메소드를 추가하고, promise도 추가 됨
import fs from 'fs-extra'
import * as imports from '../imports'

async function registerTSNode({ tsConfigPath, options }) {
  const { register } = await imports.tsNode()

  // https://github.com/TypeStrong/ts-node
  register({
    project: tsConfigPath,
    compilerOptions: {
      module: 'commonjs'
    },
    ...options
  })
}

async function getNuxtTypeScript() {
  try {
    return await imports.nuxtTypescript()
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw (error)
    }
  }
}

export async function detectTypeScript(rootDir, options = {}) {
  const typescript = {
    // 전달받은 rootDir에서부터 tsconfig.son까지의 절대경로
    tsConfigPath: path.resolve(rootDir, 'tsconfig.json'),
    tsConfigExists: false,
    runtime: false,
    build: false,
    options
  }

  // Check if tsconfig.json exists
  typescript.tsConfigExists = await fs.exists(typescript.tsConfigPath)

  // Skip if tsconfig.json not exists
  if (!typescript.tsConfigExists) {
    return typescript
  }

  // Register runtime support
  typescript.runtime = true
  await registerTSNode(typescript)

  // Try to load @nuxt/typescript
  const nuxtTypeScript = await getNuxtTypeScript()

  // If exists do additional setup
  if (nuxtTypeScript) {
    typescript.build = true
    await nuxtTypeScript.setupDefaults(typescript.tsConfigPath)
  }

  return typescript
}
