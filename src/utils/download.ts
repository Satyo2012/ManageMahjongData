/** Object URL を即座に revoke すると一部ブラウザでダウンロードが中断されるため少し待つ */
const REVOKE_DELAY_MS = 1000

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}
