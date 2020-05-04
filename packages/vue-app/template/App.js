import Vue from 'vue'
<% utilsImports = [
  ...(features.asyncData || features.fetch) ? [
    'getMatchedComponentsInstances',
    'getChildrenComponentInstancesUsingFetch',
    'promisify',
    'globalHandleError'
  ] : [],
  ...features.layouts ? [
    'sanitizeComponent'
  ]: []
] %>
<% if (utilsImports.length) { %>import { <%= utilsImports.join(', ') %> } from './utils'<% } %>
<% if (features.layouts && components.ErrorPage) { %>import NuxtError from '<%= components.ErrorPage %>'<% } %>
<% if (loading) { %>import NuxtLoading from '<%= (typeof loading === "string" ? loading : "./components/nuxt-loading.vue") %>'<% } %>
<% if (buildIndicator) { %>import NuxtBuildIndicator from './components/nuxt-build-indicator'<% } %>
<% css.forEach((c) => { %>
import '<%= relativeToBuild(resolvePath(c.src || c, { isStyle: true })) %>'
<% }) %>

<% if (features.layouts) { %>
<%= Object.keys(layouts).map((key) => {
  if (splitChunks.layouts) {
    return `const _${hash(key)} = () => import('${layouts[key]}'  /* webpackChunkName: "${wChunk('layouts/' + key)}" */).then(m => sanitizeComponent(m.default || m))`
  } else {
    return `import _${hash(key)} from '${layouts[key]}'`
  }
}).join('\n') %>

<% if (splitChunks.layouts) { %>
let resolvedLayouts = {}
const layouts = { <%= Object.keys(layouts).map(key => `"_${key}": _${hash(key)}`).join(',') %> }<%= isTest ? '// eslint-disable-line' : '' %>
<% } else { %>
const layouts = { <%= Object.keys(layouts).map(key => `"_${key}": sanitizeComponent(_${hash(key)})`).join(',') %> }<%= isTest ? '// eslint-disable-line' : '' %>
<% } %>

<% } %>

export default {
  render (h, props) {
    <% if (loading) { %>const loadingEl = h('NuxtLoading', { ref: 'loading' })<% } %>
    <% if (features.layouts) { %>
    <% if (components.ErrorPage) { %>
    if (this.nuxt.err && NuxtError) {
      const errorLayout = (NuxtError.options || NuxtError).layout
      if (errorLayout) {
        this.setLayout(
          typeof errorLayout === 'function'
            ? errorLayout.call(NuxtError, this.context)
            : errorLayout
        )
      }
    }
    <% } %>
    const layoutEl = h(this.layout || 'nuxt')
    const templateEl = h('div', {
      domProps: {
        id: '__layout'
      },
      key: this.layoutName
    }, [layoutEl])
    <% } else { %>
    const templateEl = h('nuxt')
    <% } %>

    <% if (features.transitions) { %>
    const transitionEl = h('transition', {
      props: {
        name: '<%= layoutTransition.name %>',
        mode: '<%= layoutTransition.mode %>'
      },
      on: {
        beforeEnter (el) {
          // Ensure to trigger scroll event after calling scrollBehavior
          window.<%= globals.nuxt %>.$nextTick(() => {
            window.<%= globals.nuxt %>.$emit('triggerScroll')
          })
        }
      }
    }, [templateEl])
    <% } %>

    return h('div', {
      domProps: {
        id: '<%= globals.id %>'
      }
    }, [
      <% if (loading) { %>loadingEl, <% } %>
      <% if (buildIndicator) { %>h(NuxtBuildIndicator), <% } %>
      <% if (features.transitions) { %>transitionEl<% } else { %>templateEl<% } %>
    ])
  },
  <% if (features.clientOnline || features.layouts) { %>
  data: () => ({
    <% if (features.clientOnline) { %>
    isOnline: true,
    <% } %>
    <% if (features.layouts) { %>
    layout: null,
    layoutName: '',
    <% } %>
    <% if (features.fetch) { %>
    nbFetching: 0
    <% } %>
    }),
  <% } %>
  beforeCreate () {
    Vue.util.defineReactive(this, 'nuxt', this.$options.nuxt)
    <% if ((features.asyncData || features.fetch) && isFullStatic) { %>
    if (process.client) {
      Vue.util.defineReactive(this, 'payloadPath', window.__PAYLOAD_PATH__)
    }
    <% } %>
  },
  created () {
    // Add this.$nuxt in child instances
    Vue.prototype.<%= globals.nuxt %> = this
    if (process.client) {
      // add to window so we can listen when ready
      window.<%= globals.nuxt %> = <%= (globals.nuxt !== '$nuxt' ? 'window.$nuxt = ' : '') %>this
      <% if (features.clientOnline) { %>
      this.refreshOnlineStatus()
      // Setup the listeners
      window.addEventListener('online', this.refreshOnlineStatus)
      window.addEventListener('offline', this.refreshOnlineStatus)
      <% } %>
    }
    // Add $nuxt.error()
    this.error = this.nuxt.error
    // Add $nuxt.context
    this.context = this.$options.context
  },
  <% if (loading) { %>
  mounted () {
    this.$loading = this.$refs.loading
  },
  watch: {
    'nuxt.err': 'errorChanged'
  },
  <% } %>
  <% if (features.clientOnline) { %>
  computed: {
    isOffline () {
      return !this.isOnline
    },
    <% if (features.fetch) { %>
      isFetching() {
      return this.nbFetching > 0
    }
    <% } %>
  },
  <% } %>
  methods: {
    <%= isTest ? '/* eslint-disable comma-dangle */' : '' %>
    <% if (features.clientOnline) { %>
    refreshOnlineStatus () {
      if (process.client) {
        if (typeof window.navigator.onLine === 'undefined') {
          // If the browser doesn't support connection status reports
          // assume that we are online because most apps' only react
          // when they now that the connection has been interrupted
          this.isOnline = true
        } else {
          this.isOnline = window.navigator.onLine
        }
      }
    },
    <% } %>
    async refresh () {
      <% if (features.asyncData || features.fetch) { %>
      const pages = getMatchedComponentsInstances(this.$route)

      if (!pages.length) {
        return
      }
      <% if (loading) { %>this.$loading.start()<% } %>

      const promises = pages.map((page) => {
        const p = []

        <% if (features.fetch) { %>
        // Old fetch
        if (page.$options.fetch && page.$options.fetch.length) {
          p.push(promisify(page.$options.fetch, this.context))
        }
        if (page.$fetch) {
          p.push(page.$fetch())
        } else {
          // Get all component instance to call $fetch
          for (const component of getChildrenComponentInstancesUsingFetch(page.$vnode.componentInstance)) {
            p.push(component.$fetch())
          }
        }
        <% } %>
        <% if (features.asyncData) { %>
        if (page.$options.asyncData) {
          p.push(
            promisify(page.$options.asyncData, this.context)
              .then((newData) => {
                for (const key in newData) {
                  Vue.set(page.$data, key, newData[key])
                }
              })
          )
        }
        <% } %>
        return Promise.all(p)
      })
      try {
        await Promise.all(promises)
      } catch (error) {
        <% if (loading) { %>this.$loading.fail(error)<% } %>
        globalHandleError(error)
        this.error(error)
      }
      <% if (loading) { %>this.$loading.finish()<% } %>
      <% } %>
    },
    <% if (loading) { %>
    errorChanged () {
      if (this.nuxt.err && this.$loading) {
        if (this.$loading.fail) {
          this.$loading.fail(this.nuxt.err)
        }
        if (this.$loading.finish) {
          this.$loading.finish()
        }
      }
    },
    <% } %>
    <% if (features.layouts) { %>
    <% if (splitChunks.layouts) { %>
    setLayout (layout) {
      <% if (debug) { %>
      if(layout && typeof layout !== 'string') {
        throw new Error('[nuxt] Avoid using non-string value as layout property.')
      }
      <% } %>
      if (!layout || !resolvedLayouts['_' + layout]) {
        layout = 'default'
      }
      this.layoutName = layout
      let _layout = '_' + layout
      this.layout = resolvedLayouts[_layout]
      return this.layout
    },
    loadLayout (layout) {
      const undef = !layout
      const nonexistent = !(layouts['_' + layout] || resolvedLayouts['_' + layout])
      let _layout = '_' + ((undef || nonexistent) ? 'default' : layout)
      if (resolvedLayouts[_layout]) {
        return Promise.resolve(resolvedLayouts[_layout])
      }
      return layouts[_layout]()
        .then((Component) => {
          resolvedLayouts[_layout] = Component
          delete layouts[_layout]
          return resolvedLayouts[_layout]
        })
        .catch((e) => {
          if (this.<%= globals.nuxt %>) {
            return this.<%= globals.nuxt %>.error({ statusCode: 500, message: e.message })
          }
        })
    },
    <% } else { %>
    setLayout (layout) {
      <% if (debug) { %>
      if(layout && typeof layout !== 'string') {
        throw new Error('[nuxt] Avoid using non-string value as layout property.')
      }
      <% } %>
      if (!layout || !layouts['_' + layout]) {
        layout = 'default'
      }
      this.layoutName = layout
      this.layout = layouts['_' + layout]
      return this.layout
    },
    loadLayout (layout) {
      if (!layout || !layouts['_' + layout]) {
        layout = 'default'
      }
      return Promise.resolve(layouts['_' + layout])
    },
    <% } /* splitChunks.layouts */ %>
    <% } /* features.layouts */ %>
    <% if (isFullStatic) { %>
    setPagePayload(payload) {
      this._pagePayload = payload
      this._payloadFetchIndex = 0
    },
    getPayloadPath(href) {
      return (`${this.payloadPath}/${href.replace(/\/$/, '')}/payload.json`).replace(/\/+/g, '/')
    },
    hasPayload(href) {
      return !!(this._payloadCache && this._payloadCache[this.getPayloadPath(href)])
    },
    async fetchPayload (href) {
      this._payloadCache = this._payloadCache || {}
      const payloadPath = this.getPayloadPath(href)
      let payload = this._payloadCache[payloadPath]

      // If payload is a promise, returns it
      if (payload && payload instanceof Promise && typeof payload.then === 'function') {
        return payload
      }
      // if payload is in cache
      else if (typeof payload !== 'undefined') {
        this.setPagePayload(payload)
        return payload
      }
      // fetch payload
      this._payloadCache[payloadPath] = fetch(payloadPath)
        .then(res => {
          if (!res.ok) {
            // used for spa fallback
            this._payloadCache[payloadPath] = false
            this.setPagePayload(false)
            throw new Error(res.statusText)
          }
          return res.json()
        })
        .then(payload => {
          this._payloadCache[payloadPath] = payload
          this.setPagePayload(payload)
          return payload
        })
      // return promise
      return this._payloadCache[payloadPath]
    }
    <% } %>
  },
  <% if (loading) { %>
  components: {
    NuxtLoading
  }
  <% } %>
  <%= isTest ? '/* eslint-enable comma-dangle */' : '' %>
}
