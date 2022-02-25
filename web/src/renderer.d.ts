export interface IpcRendererApi {
  sendCloseMsg: () => void
  sendReloadMsg: () => void
  sendShutdownMsg: (delaySeconds: number) => void
}

declare global {
  interface Window {
    ipcRenderer: IpcRendererApi
  }
}