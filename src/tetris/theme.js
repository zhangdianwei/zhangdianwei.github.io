import patrickHandUrl from '../font/PatrickHand-Regular.ttf'

export const theme = {
  fontFamily: 'Patrick Hand, Comic Sans MS, Chalkduster, sans-serif',
  hudFontSize: 16,
}

const patrickHandFace = new FontFace('Patrick Hand', `url(${patrickHandUrl})`)
export const fontReady = patrickHandFace.load().then((loadedFace) => {
  document.fonts.add(loadedFace)
})
