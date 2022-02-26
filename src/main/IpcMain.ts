import { app, BrowserWindow, ipcMain, systemPreferences } from "electron"
import childProcess from 'child_process'
import path from 'path'
import fs from 'fs'

export function initIpcMain(mainWindow: BrowserWindow) {
  ipcMain.on('app-close', () => {
    app.quit()
  })

  ipcMain.once('window-reload', () => {
    mainWindow.reload()
  })

  ipcMain.on('computer-shutdown', (event, delaySeconds: number) => {
    if (delaySeconds < 0) {
      childProcess.exec('shutdown -a')
    } else {
      childProcess.exec('shutdown -s -t ' + delaySeconds)
    }
  })

  ipcMain.handle('get-system-color', () => {
    return systemPreferences.getColor('active-border')
  })

  ipcMain.handle('get-cloud-music-history', () => {
    const finalPath = path.join(app.getPath('home'), '/AppData/Local/Netease/CloudMusic/webdata/file/history')
    try {
      const data = fs.readFileSync(finalPath, { encoding: 'utf-8' })
      const jsonObject = JSON.parse(data)
      return jsonObject
    } catch(err) {
      return {}
    }
  })
}