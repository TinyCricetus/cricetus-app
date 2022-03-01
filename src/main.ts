import { app } from 'electron'
import { __DEV__ } from './env'
import { createWindow, initApp, initAppMenu } from './main/app'
import { initIpcMain } from './main/ipc-main'

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
    initIpcMain(mainWindow)
    
    if (__DEV__) {
      initAppMenu()
    }
  })
}


