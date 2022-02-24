export interface IpcRendererApi {
  sendCloseMsg: () => void
  sendReloadMsg: () => void
}

declare global {
  interface Window {
    ipcRenderer: IpcRendererApi
  }
}