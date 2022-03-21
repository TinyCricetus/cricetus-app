import { __DEV_HOST__ } from "../env"

export function checkWebAvailable(onWebAvailable: () => void) {
  setTimeout(async () => {
    let response = null
    try {
      response = await fetch(__DEV_HOST__)
    } catch (err) { }
    if (response) {
      onWebAvailable()
    } else {
      checkWebAvailable(onWebAvailable)
    }
  }, 1000)
}