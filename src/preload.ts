// preload.js
import { contextBridge, ipcRenderer } from 'electron'
import { __DEV__ } from './env'
import { checkWebAvailable } from './renderer/develop-helper'

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
    },
    invokeToGetCloudMusicHistory: (): Promise<any> => {
      return ipcRenderer.invoke('get-cloud-music-history')
    }
  }
)


if (__DEV__) {
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
