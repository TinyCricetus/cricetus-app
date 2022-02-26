import { app, BrowserWindow, Menu, MenuItem } from 'electron'
import path from "path"
import { __DEV__ } from '../Env'

export function createWindow() {
  const mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, '../../public/favicon.ico'),
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../../src-dist/', 'Preload.js'),
      webSecurity: false
    },
    titleBarStyle: 'hidden',
    resizable: __DEV__,
    transparent: !__DEV__
  })
  if (__DEV__) {
    mainWindow.loadURL('http://localhost:8080')
  } else {
    mainWindow.loadFile(path.resolve(__dirname, '../../web/dist/index.html'))
  }

  return mainWindow
}

export function initApp(mainWindow: BrowserWindow) {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
      return
    }
    mainWindow.focus()
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

export function initAppMenu() {
  const menu = new Menu()
  menu.append(new MenuItem({
    submenu: [
      {
        role: 'reload',
        accelerator: 'F5'
      },
      {
        role: 'toggleDevTools',
        accelerator: 'F12'
      }
    ]
  }))

  Menu.setApplicationMenu(menu)
}