export interface CloudMusicHistoryItem {
  id: string
  time: number
  track: {
    name?: string
    artists?: Array<{ name: string }>
  }
}

export interface IpcRendererBridge {
  sendCloseMsg: () => void
  sendReloadMsg: () => void
  sendShutdownMsg: (delaySeconds: number) => void
  invokeToGetSystemColor: () => Promise<string>
  invokeToGetCloudMusicHistory: () => Promise<CloudMusicHistoryItem[]>
}

declare global {
  interface Window {
    ipcRenderer?: IpcRendererBridge
  }
}

export {}
