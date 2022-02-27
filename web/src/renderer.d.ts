export interface IpcRendererApi {
  sendCloseMsg: () => void
  sendReloadMsg: () => void
  sendShutdownMsg: (delaySeconds: number) => void
  invokeToGetSystemColor: () => Promise<string>
  invokeToGetCloudMusicHistory: () => Promise<any[]>
}

declare global {
  interface Window {
    ipcRenderer: IpcRendererApi
  }
}