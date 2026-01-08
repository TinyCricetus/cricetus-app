export const __DEV__ = process.env.STAGE === 'development'

export const __WEB_FRAME__ = process.env.FRAME ?? 'react'

export const __DEV_HOST__ = 'http://localhost:' + getServerPort()

export const __WEB_ENTRY_PATH__ = 'web/dist/index.html'

function getServerPort() {
  return '5173'
}
