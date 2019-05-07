import Vue from 'vue'
import { compile } from '../utils'

<% if (components.ErrorPage) { %>
  <% if (('~@').includes(components.ErrorPage.charAt(0))) { %>
import NuxtError from '<%= components.ErrorPage %>'
  <% } else { %>
import NuxtError from '<%= "../" + components.ErrorPage %>'
  <% } %>
<% } else { %>
import NuxtError from './nuxt-error.vue'
<% } %>
import NuxtChild from './nuxt-child'

<%= isTest ? '// @vue/component' : '' %>
export default {
  name: 'Nuxt',
  components: {
    NuxtChild,
    NuxtError
  },
  props: {
    nuxtChildKey: {
      type: String,
      default: undefined
    },
    keepAlive: Boolean,
    keepAliveProps: {
      type: Object,
      default: undefined
    },
    name: {
      type: String,
      default: 'default'
    }
  },
  computed: {
    routerViewKey() {
      // If nuxtChildKey prop is given or current route has children
      if (typeof this.nuxtChildKey !== 'undefined' || this.$route.matched.length > 1) {
        return this.nuxtChildKey || compile(this.$route.matched[0].path)(this.$route.params)
      }

      const Component = this.$route.matched[0] && this.$route.matched[0].components.default
      if (Component && Component.options) {
        const { key, watchQuery } = Component.options
        if (key) {
          return (typeof key === 'function' ? key(this.$route) : key)
        } else if (watchQuery) {
          if (watchQuery.length) {
            const pickedQuery = {}
            for (const key of watchQuery) {
                pickedQuery[key] = this.$route.query[key]
            }
            return this.$router.resolve({
                path: this.$route.path,
                query: pickedQuery
            }).href
          } else {
            return this.$route.fullPath
          }
        }
      }

      return this.$route.path
    }
  },
  beforeCreate() {
    Vue.util.defineReactive(this, 'nuxt', this.$root.$options.nuxt)
  },
  render(h) {
    // If there is some error
    if (this.nuxt.err) {
      return h('NuxtError', {
        props: {
          error: this.nuxt.err
        }
      })
    }
    // Directly return nuxt child
    return h('NuxtChild', {
      key: this.routerViewKey,
      props: this.$props
    })
  }
}
