// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, MenuItem, ipcMain, systemPreferences } from 'electron'
import path from "path"
import childProcess from 'child_process'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, '../public/favicon.ico'),
    width: 600,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../src-dist/', 'preload.js'),
      webSecurity: false
    },
    titleBarStyle: 'hidden',
    resizable: false,
    transparent: true
  })
  if (process.env.STAGE === 'development') {
    mainWindow.loadURL('http://localhost:8080')
  } else {
    mainWindow.loadFile(path.resolve(__dirname, '../web/dist/index.html'))
  }
  // and load the index.html of the app.

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

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
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. 也可以拆分成几个文件，然后用 require 导入。

const menu = new Menu()
menu.append(new MenuItem({
  submenu: [
    {
      role: 'reload',
      accelerator: 'F5',
      click: () => { console.log('reload!') }
    },
    {
      role: 'toggleDevTools',
      accelerator: 'F12',
      click: () => { console.log('show console!') }
    }
  ]
}))

Menu.setApplicationMenu(menu)
