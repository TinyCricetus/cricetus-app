import { app } from 'electron'
import { createWindow, initApp, initAppMenu } from './main/App'
import { initIpcMain } from './main/IpcMain'

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // 部分 API 在 ready 事件触发后才能使用。
  app.whenReady().then(() => {
    const mainWindow = createWindow()
    initApp(mainWindow)
    initAppMenu()
    initIpcMain(mainWindow)
  })
}


