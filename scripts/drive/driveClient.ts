import { GOOGLE_SHEET_MIME, XLSX_MIME, type DriveFile } from '../../src/domain/driveSync.ts'

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'

async function driveFetch(url: string, token: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    throw new Error(`Google Drive API エラー (${res.status}) ${url.split('?')[0]}: ${await res.text()}`)
  }
  return res
}

/** フォルダ直下の Excel / Google スプレッドシートを一覧する（ゴミ箱は除く） */
export async function listSpreadsheets(folderId: string, token: string): Promise<DriveFile[]> {
  const files: DriveFile[] = []
  let pageToken: string | undefined
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType = '${XLSX_MIME}' or mimeType = '${GOOGLE_SHEET_MIME}')`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: '1000',
      // 共有ドライブ上のフォルダにも対応
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    })
    if (pageToken) params.set('pageToken', pageToken)
    const res = await driveFetch(`${DRIVE_API}?${params}`, token)
    const body = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string }
    files.push(...(body.files ?? []))
    pageToken = body.nextPageToken
  } while (pageToken)
  return files
}

/** ファイルの中身を xlsx 形式で取得する。Google スプレッドシートは xlsx に変換して書き出す */
export async function downloadAsXlsx(file: DriveFile, token: string): Promise<ArrayBuffer> {
  const url =
    file.mimeType === GOOGLE_SHEET_MIME
      ? `${DRIVE_API}/${file.id}/export?mimeType=${encodeURIComponent(XLSX_MIME)}`
      : `${DRIVE_API}/${file.id}?alt=media&supportsAllDrives=true`
  const res = await driveFetch(url, token)
  return res.arrayBuffer()
}
