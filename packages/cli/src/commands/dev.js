import consola from 'consola'
import chalk from 'chalk'
import opn from 'opn'
import { common, server } from '../options'
import { showBanner, eventsMapping, formatPath } from '../utils'

export default {
  name: 'dev',
  description: 'Start the application in development mode (e.g. hot-code reloading, error reporting)',
  usage: 'dev <dir>',
  options: {
    ...common,
    ...server,
    open: {
      alias: 'o',
      type: 'boolean',
      description: 'Opens the server listeners url in the default browser'
    }
  },

  async run(cmd) {
    const { argv } = cmd
    const nuxt = await this.startDev(cmd, argv)

    // Opens the server listeners url in the default browser
    if (argv.open) {
      for (const listener of nuxt.server.listeners) {
        await opn(listener.url)
      }
    }
  },

  async startDev(cmd, argv) {
    try {
      return await this._startDev(cmd, argv)
    } catch (error) {
      consola.error(error)
    }
  },

  async _startDev(cmd, argv) {
    const config = await cmd.getNuxtConfig({ dev: true })
    const nuxt = await cmd.getNuxt(config)

    // Setup hooks
    nuxt.hook('watch:restart', payload => this.onWatchRestart(payload, { nuxt, builder, cmd, argv }))
    nuxt.hook('bundler:change', changedFileName => this.onBundlerChange(changedFileName))

    // Start listening
    await nuxt.server.listen()

    // Create builder instance
    const builder = await cmd.getBuilder(nuxt)

    // Start Build
    await builder.build()

    // Show banner after build
    showBanner(nuxt)

    // Return instance
    return nuxt
  },

  logChanged({ event, path }) {
    const { icon, color, action } = eventsMapping[event] || eventsMapping.change

    consola.log({
      type: event,
      icon: chalk[color].bold(icon),
      message: `${action} ${chalk.cyan(formatPath(path))}`
    })
  },

  async onWatchRestart({ event, path }, { nuxt, cmd, argv }) {
    this.logChanged({ event, path })

    await nuxt.close()

    await this.startDev(cmd, argv)
  },

  onBundlerChange(path) {
    this.logChanged({ event: 'change', path })
  }
}
