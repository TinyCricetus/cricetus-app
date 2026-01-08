import './toast.css'

export type ToastType = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  type: ToastType
  text: string
}

export default function Toast({ message }: { message: ToastMessage | null }) {
  if (!message) {
    return null
  }

  return <div className={`toast toast--${message.type}`}>{message.text}</div>
}
