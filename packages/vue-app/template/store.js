import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

let storeData = {}

let files

void function updateModules() {
  <% storeModules.some(s => {
    if(s.src.indexOf('index.') === 0) { %>
  storeData = require('@/<%= dir.store %>/<%= s.src %>')
  <% return true }}) %>
  // If store is not an exported method = modules store
  if (typeof storeData !== 'function') {
    // Store modules
    if (!storeData.modules) {
      storeData.modules = {}
    }
    <% storeModules.forEach(s => {
      if(s.src.indexOf('index.') !== 0) { %>
    resolveStoreModules(require('@/<%= dir.store %>/<%= s.src %>'), '<%= s.src %>')<% }}) %>

  // If the environment supports hot reloading...
  <% if (isDev) { %>
    if (process.client && module.hot) {
      // Whenever any Vuex module is updated...
      module.hot.accept([<% storeModules.forEach(s => { %>
        '@/<%= dir.store %>/<%= s.src %>',<% }) %>
      ], () => {
        // Update `root.modules` with the latest definitions.
        updateModules()
        // Trigger a hot update in the store.
        window.<%= globals.nuxt %>.$store.hotUpdate(storeData)
      })
    }<% } %>
  } else {
    const log = (process.server ? require('consola') : console)
    log.warn('Classic mode for store/ is deprecated and will be removed in Nuxt 3.')
  }
})()

// createStore
export const createStore = storeData instanceof Function ? storeData : () => {
  return new Vuex.Store(Object.assign({
    strict: (process.env.NODE_ENV !== 'production')
  }, storeData, {
    state: storeData.state instanceof Function ? storeData.state() : {}
  }))
}

function resolveStoreModules(fileModule, filename) {
  let name = filename.replace(/\.(<%= extensions %>)$/, '')
  const namePath = name.split(/\//)

  name = namePath[namePath.length - 1]
  if (['state', 'getters', 'actions', 'mutations'].includes(name)) {
    const module = getModuleNamespace(storeData, namePath, true)
    appendModule(module, fileModule, name)
    return
  }

  // If file is foo/index.js, it should be saved as foo
  const isIndex = (name === 'index')
  if (isIndex) {
    namePath.pop()
  }

  const module = getModuleNamespace(storeData, namePath)
  checkModule(fileModule, filename)

  name = namePath.pop()
  module[name] = module[name] || {}

  // if file is foo.js, existing properties take priority
  // because it's the least specific case
  if (!isIndex) {
    module[name] = Object.assign({}, fileModule, module[name])
    module[name].namespaced = true
    return
  }

  // if file is foo/index.js we want to overwrite properties from foo.js
  // but not from appended mods like foo/actions.js
  const appendedMods = {}
  if (module[name].appends) {
    appendedMods.appends = module[name].appends
    for (const append of module[name].appends) {
      appendedMods[append] = module[name][append]
    }
  }

  module[name] = Object.assign({}, module[name], fileModule, appendedMods)
  module[name].namespaced = true
}

// Dynamically require module
function checkModule(module, filename) {
  if (module.commit) {
    throw new Error('[nuxt] <%= dir.store %>/' + filename + ' should export a method which returns a Vuex instance.')
  }
  if (module.state && typeof module.state !== 'function') {
    throw new Error('[nuxt] state should be a function in <%= dir.store %>/' + filename)
  }
}

function getModuleNamespace(storeData, namePath, forAppend = false) {
  if (namePath.length === 1) {
    if (forAppend) {
      return storeData
    }
    return storeData.modules
  }
  const namespace = namePath.shift()
  storeData.modules[namespace] = storeData.modules[namespace] || {}
  storeData.modules[namespace].namespaced = true
  storeData.modules[namespace].modules = storeData.modules[namespace].modules || {}
  return getModuleNamespace(storeData.modules[namespace], namePath, forAppend)
}

function appendModule(module, subModule, name) {
  module.appends = module.appends || []
  module.appends.push(name)
  module[name] = subModule.default || subModule
}
