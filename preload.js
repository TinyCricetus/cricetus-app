// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'ipcRenderer',
  {
    sendCloseMsg: function () {
      ipcRenderer.send('test-message')
    },
    sendReloadMsg: function () {
      ipcRenderer.send('window-reload')
    }
  }
)

async function checkWebAvailable() {
  setTimeout(async () => {
    let response = null
    try {
      response = await fetch('http://localhost:8080')
    } catch (err) { }
    if (response) {
      ipcRenderer.send('window-reload')
    } else {
      checkWebAvailable()
    }
  }, 1000)
}

checkWebAvailable()

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
