import type { CloudMusicHistoryItem } from '../types/ipc-renderer'

export class IpcRendererService {
  private static ins: IpcRenderer | null = null

  public static get Ins(): IpcRenderer {
    if (!this.ins) {
      this.ins = window.ipcRenderer ? new ElectronIpcRenderer() : new IpcRenderer()
    }
    return this.ins
  }

  private constructor() {}
}

class IpcRenderer {
  sendCloseMsg() {}

  sendReloadMsg() {}

  sendShutdownMsg(_delaySeconds: number) {}

  invokeToGetSystemColor() {
    return Promise.resolve('rgb(167, 167, 167)')
  }

  invokeToGetCloudMusicHistory(): Promise<CloudMusicHistoryItem[]> {
    return Promise.resolve<CloudMusicHistoryItem[]>([])
  }
}

class ElectronIpcRenderer extends IpcRenderer {
  sendCloseMsg() {
    window.ipcRenderer?.sendCloseMsg()
  }

  sendReloadMsg() {
    window.ipcRenderer?.sendReloadMsg()
  }

  sendShutdownMsg(delaySeconds: number) {
    window.ipcRenderer?.sendShutdownMsg(delaySeconds)
  }

  invokeToGetSystemColor() {
    return window.ipcRenderer?.invokeToGetSystemColor() ?? Promise.resolve('rgb(167, 167, 167)')
  }

  invokeToGetCloudMusicHistory(): Promise<CloudMusicHistoryItem[]> {
    return window.ipcRenderer?.invokeToGetCloudMusicHistory() ?? Promise.resolve<CloudMusicHistoryItem[]>([])
  }
}
