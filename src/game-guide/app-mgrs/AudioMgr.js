export default class AudioMgr {
  constructor({ volume = 1, muted = false } = {}) {
    this.volume = volume
    this.muted = muted
    this.context = null
    this.master = null
    this.buffers = new Map()
    this.sources = new Map()
  }

  getContext() {
    if (this.context) return this.context
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    this.context = new AudioContext()
    this.master = this.context.createGain()
    this.master.connect(this.context.destination)
    this.syncVolume()
    return this.context
  }

  async load(name, url) {
    const context = this.getContext()
    if (!context) return null
    const response = await fetch(url)
    const buffer = await context.decodeAudioData(await response.arrayBuffer())
    this.buffers.set(name, buffer)
    return buffer
  }

  async loadAll(files) {
    await Promise.all(Object.entries(files).map(([name, url]) => this.load(name, url)))
  }

  play(name, { loop = false, volume = 1 } = {}) {
    const context = this.getContext()
    const buffer = this.buffers.get(name)
    if (!context || !buffer) return null

    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = loop
    gain.gain.value = volume
    source.connect(gain).connect(this.master)

    const sources = this.sources.get(name) || new Set()
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
    const sources = this.sources.get(name)
    if (!sources) return
    sources.forEach((source) => source.stop())
    this.sources.delete(name)
  }

  stopAll() {
    Array.from(this.sources.keys()).forEach((name) => this.stop(name))
  }

  setVolume(volume) {
    this.volume = volume
    this.syncVolume()
  }

  setMuted(muted) {
    this.muted = muted
    this.syncVolume()
  }

  syncVolume() {
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume
  }

  destroy() {
    this.stopAll()
    void this.context?.close()
    this.buffers.clear()
    this.context = null
    this.master = null
  }
}
