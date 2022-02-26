export interface IpcRendererApi {
  sendCloseMsg: () => void
  sendReloadMsg: () => void
  sendShutdownMsg: (delaySeconds: number) => void
  invokeToGetSystemColor: () => Promise<string>
}

declare global {
  interface Window {
    ipcRenderer: IpcRendererApi
  }
}