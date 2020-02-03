import Browser from '../utils/browser'
import { loadFixture, getPort, Nuxt } from '../utils'

let port
const browser = new Browser()
const url = route => 'http://localhost:' + port + route

let nuxt = null
let page = null

describe('basic browser', () => {
  beforeAll(async () => {
    const config = await loadFixture('fetch')
    nuxt = new Nuxt(config)
    await nuxt.ready()

    port = await getPort()
    await nuxt.server.listen(port, 'localhost')

    await browser.start({
      // slowMo: 50,
      // headless: false
    })
  })

  test('Open /', async () => {
    page = await browser.page(url('/'))
    expect(await page.$text('pre')).toContain('Atinux')
  })

  test('/fetch-client', async () => {
    await page.nuxt.navigate('/fetch-client')
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('pre')
    expect(await page.$text('pre')).toContain('pi0')
  })

  test('/fetch-error', async () => {
    await page.nuxt.navigate('/fetch-error')
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('#error')
    expect(await page.$text('#error')).toContain('fetch-error')
  })

  test('/fetch-component', async () => {
    await page.nuxt.navigate('/fetch-component')
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('pre')
    expect(await page.$text('pre')).toContain('clarkdo')
  })

  test('/fetch-delay', async () => {
    const now = Date.now()
    await page.nuxt.navigate('/fetch-delay')
    expect(await page.$text('p')).toContain('Fetching for 1 second')
    await page.waitForSelector('pre')
    const delay = Date.now() - now
    expect(await page.$text('pre')).toContain('alexchopin')
    expect(delay).toBeGreaterThanOrEqual(1000)
  })

  test('/fetch-button', async () => {
    await page.nuxt.navigate('/fetch-button')
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('pre')
    expect(await page.$text('pre')).toContain('kevinmarrec')
    await page.click('button')
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('pre')
    expect(await page.$text('pre')).toContain('kevinmarrec')
  })

  test('/old-fetch', async () => {
    const msg = new Promise(resolve =>
      page.on('console', msg => resolve(msg.text()))
    )
    await page.nuxt.navigate('/old-fetch')
    expect(await msg).toBe('fetch(context) has been deprecated, please use middleware(context)')
  })

  test('ssr: /fetch-client', async () => {
    const page = await browser.page(url('/fetch-client'))
    expect(await page.$text('p')).toContain('Fetching...')
    await page.waitForSelector('pre')
    expect(await page.$text('pre')).toContain('pi0')
    page.close()
  })

  test('ssr: /fetch-error', async () => {
    const page = await browser.page(url('/fetch-error'))
    expect(await page.$text('#error')).toContain('fetch-error')
    page.close()
  })

  test('ssr: /fetch-deep', async () => {
    const page = await browser.page(url('/fetch-deep'))
    const expectedState = {
      foo: 'bar',
      user: {
        name: 'Potato',
        inventory: {
          // type: 'green',
          items: ['A', 'B']
        },
        foo: 'barbar'
      },
      async: 'data',
      async2: 'data2fetch'
    }

    // SSR Rendered HTML
    const renderedData = await page.$text('#data').then(t => JSON.parse(t))
    expect(renderedData).toMatchObject(expectedState)

    // Fragments
    const dataFragments = await page.evaluate(() => window.__NUXT__.data)
    expect(dataFragments.length).toBe(2)

    // asyncData mutations
    expect(dataFragments[0]).toMatchObject({ async: 'data', async2: 'data2' })

    // fetch mutations
    expect(dataFragments[1]).toMatchObject({
      user: {
        inventory: { items: ['A', 'B'] },
        name: 'Potato'
      },
      foo: 'barbar',
      async2: 'data2fetch'
    })

    page.close()
  })

  // Close server and ask nuxt to stop listening to file changes
  afterAll(async () => {
    await nuxt.close()
  })

  // Stop browser
  afterAll(async () => {
    await page.close()
    await browser.close()
  })
})
