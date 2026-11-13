/**
 * Google ドライブのフォルダにある麻雀集計表を public/data.json に取り込む。
 *
 *   必要な環境変数:
 *     DRIVE_FOLDER_ID                 対象フォルダの ID（URL の folders/ の後ろ）
 *     GOOGLE_SERVICE_ACCOUNT_KEY      サービスアカウント鍵 JSON の中身
 *       または GOOGLE_SERVICE_ACCOUNT_KEY_FILE  鍵 JSON のファイルパス（手元で試すとき用）
 *
 *   npm run sync:drive              # data.json を更新
 *   npm run sync:drive -- --dry-run # 何が変わるか表示するだけ
 */
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import type { SharedData } from '../src/domain/sharedDataFormat.ts'
import { serializeSharedData } from '../src/domain/sharedDataFormat.ts'
import { todayIso } from '../src/domain/date.ts'
import { fetchAccessToken, parseServiceAccountKey } from './drive/googleAuth.ts'
import { downloadAsXlsx, listSpreadsheets } from './drive/driveClient.ts'
import { parseXlsx } from './drive/parseXlsx.ts'
import { formatReport, syncBooks } from './drive/syncCore.ts'

const DATA_PATH = new URL('../public/data.json', import.meta.url)

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`環境変数 ${name} が設定されていません（docs/drive-sync.md を参照）`)
  return value
}

function readServiceAccountJson(): string {
  const file = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE?.trim()
  return file ? readFileSync(file, 'utf8') : requireEnv('GOOGLE_SERVICE_ACCOUNT_KEY')
}

/** GitHub Actions 上ならステップの出力・サマリーに書き出す */
function reportToActions(changed: boolean, summary: string): void {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')
  const folderId = requireEnv('DRIVE_FOLDER_ID')
  // Drive の検索クエリに埋め込むため、ID 以外の文字（引用符など）は受け付けない
  if (!/^[\w-]+$/.test(folderId)) throw new Error('DRIVE_FOLDER_ID の形式が正しくありません（フォルダ URL の folders/ の後ろの英数字）')
  const key = parseServiceAccountKey(readServiceAccountJson())

  const shared = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as SharedData
  const token = await fetchAccessToken(key)
  const files = await listSpreadsheets(folderId, token)
  console.log(`ドライブ上のファイル: ${files.length}件 / data.json のブック: ${shared.books.length}件`)

  const result = await syncBooks(shared.books, files, {
    loadBook: async (file, fileName) => parseXlsx(await downloadAsXlsx(file, token), fileName),
  })
  const summary = formatReport(result.report)
  console.log(summary)

  if (result.changed && !dryRun) {
    writeFileSync(DATA_PATH, serializeSharedData(result.books, shared.nameAliases ?? {}, todayIso()))
    console.log('public/data.json を更新しました')
  }
  reportToActions(result.changed && !dryRun, summary)
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
