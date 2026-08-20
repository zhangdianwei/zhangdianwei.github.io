export default class AudioMgr {
  constructor({ volume = 1 } = {}) {
    this.volume = volume
    this.context = null
    this.master = null
    this.buffers = new Map()
    this.loading = new Map()
    this.pending = new Map()
    this.sources = new Map()
  }

  getContext() {
    if (this.context) return this.context
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    this.context = new AudioContext()
    this.master = this.context.createGain()
    this.master.gain.value = this.volume
    this.master.connect(this.context.destination)
    return this.context
  }

  async load(name, url) {
    const context = this.getContext()
    if (!context) return
    const response = await fetch(url)
    const buffer = await context.decodeAudioData(await response.arrayBuffer())
    this.buffers.set(name, buffer)
    this.loading.delete(name)
    const options = this.pending.get(name)
    if (!options) return
    this.pending.delete(name)
    this.play(name, options)
  }

  loadAll(files) {
    const tasks = Object.entries(files).map(([name, url]) => {
      const task = this.load(name, url)
      this.loading.set(name, task)
      return task
    })
    return Promise.all(tasks)
  }

  play(name, { loop = false, volume = 1, rate = 1, maxVoices = Infinity } = {}) {
    const context = this.getContext()
    const buffer = this.buffers.get(name)
    if (!context || !buffer) {
      if (this.loading.has(name)) this.pending.set(name, { loop, volume, rate, maxVoices })
      return null
    }

    const sources = this.sources.get(name) || new Set()
    if ((loop && sources.size) || sources.size >= maxVoices) return sources.values().next().value || null

    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = loop
    source.playbackRate.value = rate
    gain.gain.value = volume
    source.connect(gain).connect(this.master)
    sources.add(source)
    this.sources.set(name, sources)
    source.onended = () => {
      sources.delete(source)
      if (!sources.size) this.sources.delete(name)
    }
    void context.resume()
    source.start()
    return source
  }

  stop(name) {
    this.pending.delete(name)
    const sources = this.sources.get(name)
    if (!sources) return
    sources.forEach((source) => source.stop())
    this.sources.delete(name)
  }

  stopAll() {
    this.pending.clear()
    Array.from(this.sources.keys()).forEach((name) => this.stop(name))
  }

  destroy() {
    this.stopAll()
    void this.context?.close()
    this.buffers.clear()
    this.loading.clear()
    this.context = null
    this.master = null
  }
}
