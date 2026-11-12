import { useCallback, useState } from 'react'
import type { Book } from '../types'
import { describeParseError, parseExcelFile } from '../utils/excelParser'

export interface ImportMessage {
  kind: 'success' | 'error'
  text: string
}

/** Excel ファイルを1つずつ読み込み、結果メッセージを溜める */
export function useExcelImport(onParsed: (book: Book, overwrite: boolean) => void) {
  const [importing, setImporting] = useState(false)
  const [messages, setMessages] = useState<ImportMessage[]>([])

  const importFiles = useCallback(
    async (files: File[], overwrite: boolean) => {
      if (files.length === 0) return
      setImporting(true)
      const results: ImportMessage[] = []
      // 1ファイルずつ処理（並列だと読み込み中表示が先に消えるなど状態が崩れていた）
      for (const file of files) {
        try {
          const book = await parseExcelFile(file)
          onParsed(book, overwrite)
          const verb = overwrite ? '上書きしました' : '追加しました'
          results.push({ kind: 'success', text: `${file.name} を${verb}（${book.games.length}局）` })
        } catch (e) {
          console.error(`${file.name} の読み込みに失敗しました`, e)
          results.push({ kind: 'error', text: `${file.name}: ${describeParseError(e)}` })
        }
      }
      setMessages(results)
      setImporting(false)
    },
    [onParsed],
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  return { importFiles, importing, messages, clearMessages }
}
