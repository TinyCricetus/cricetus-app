
export async function checkWebAvailable(onWebAvailable: () => void) {
  setTimeout(async () => {
    let response = null
    try {
      response = await fetch('http://localhost:8080')
    } catch (err) { }
    if (response) {
      onWebAvailable()
    } else {
      checkWebAvailable(onWebAvailable)
    }
  }, 1000)
}