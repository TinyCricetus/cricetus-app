export class IpcRendererService {
  private static ins: IpcRenderer = null

  public static get Ins() {
    if (window.ipcRenderer) {
      this.ins = new ElectronIpcRenderer()
    } else {
      this.ins = new IpcRenderer()
    }
    return this.ins
  }

  private constructor() {}
}

class IpcRenderer {
  sendCloseMsg() { }

  sendReloadMsg() { }

  sendShutdownMsg(delaySeconds: number) { }

  invokeToGetSystemColor() {
    return Promise.resolve('rgb(167, 167, 167)')
  }
}

class ElectronIpcRenderer extends IpcRenderer {
  sendCloseMsg() {
    window.ipcRenderer.sendCloseMsg()
  }

  sendReloadMsg() {
    window.ipcRenderer.sendReloadMsg()
  }

  sendShutdownMsg(delaySeconds: number) {
    window.ipcRenderer.sendShutdownMsg(delaySeconds)
  }

  invokeToGetSystemColor() {
    return window.ipcRenderer.invokeToGetSystemColor()
  }
}