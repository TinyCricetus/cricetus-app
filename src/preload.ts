// preload.js
import { contextBridge, ipcRenderer } from 'electron'
import { checkWebAvailable } from './renderer/DevelopHelper'

contextBridge.exposeInMainWorld('ipcRenderer',
  {
    sendCloseMsg: () => {
      ipcRenderer.send('app-close')
    },
    sendReloadMsg: () => {
      ipcRenderer.send('window-reload')
    },
    sendShutdownMsg: (delaySeconds: number) => {
      ipcRenderer.send('computer-shutdown', delaySeconds)
    },
    invokeToGetSystemColor: (): Promise<string> => {
      return ipcRenderer.invoke('get-system-color')
    }
  }
)


if (process.env.STAGE === 'development') {
  checkWebAvailable(() => {
    ipcRenderer.send('window-reload')
  })
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// window.addEventListener('DOMContentLoaded', () => {
//   const replaceText = (selector, text) => {
//     const element = document.getElementById(selector)
//     if (element) element.innerText = text
//   }

//   for (const dependency of ['chrome', 'node', 'electron']) {
//     replaceText(`${dependency}-version`, process.versions[dependency])
//   }
// })
