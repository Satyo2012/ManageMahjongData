# Google ドライブ自動同期

Google ドライブの決めたフォルダに麻雀集計表を入れておくと、**1時間ごと**に自動で取り込まれ、
`public/data.json` の更新 → 本番サイトの再デプロイまで行われます。

```
ドライブのフォルダ ──(毎時)──> GitHub Actions ──> data.json をコミット
                                                    ├─> ManageMahjongData の main
                                                    └─> managemahjongmatasny の main ──> Vercel 本番
```

## 取り込みのルール

| ドライブ上の状態 | 動作 |
| --- | --- |
| data.json に無いファイル | 読み込んで追加 |
| 手作業で登録済みのファイル（同じ名前） | 初回は紐付けだけ（日付修正などを保持） |
| 取り込み済みのファイルが編集された | 読み込み直して差し替え（ファイル名に日付が無い場合、アプリで設定した日付は引き継ぐ） |
| 同じ名前のファイルが複数 | 取り込まずに警告 |
| ファイルを削除 | **data.json からは消えません**（誤削除で成績が消えないように）。消すときはアプリのファイル管理で削除 |

- 対象は Excel (.xlsx) と Google スプレッドシート。フォルダ直下のみ（サブフォルダは見ない）
- 名前の照合では「 - Google ドライブ」「.xlsx」の有無を無視します（例: `麻雀集計表20230625` と `麻雀集計表20230625 - Google ドライブ.xlsx` は同じ）
- **ファイル名に `YYYYMMDD` の日付を入れてください。** 日付が無いと「日付不明」になり、期間フィルター・月次集計から外れます
- 読み込めないファイル（4人分の結果が揃った行が無いなど）はスキップし、次の実行で再試行します。結果は Actions の実行画面のサマリーで確認できます

## セットアップ（最初の1回だけ）

### 1. GitHub の既定ブランチを `main` にする

定期実行は既定ブランチにあるワークフローだけが動きます。現在の既定ブランチは古い `master` なので変更します。

ManageMahjongData → **Settings** → **General** → **Default branch** → `main` に切り替え

### 2. Google Cloud でサービスアカウントを作る

1. <https://console.cloud.google.com/> でプロジェクトを作成（既存のものでも可）
2. **API とサービス** → **ライブラリ** → 「Google Drive API」を**有効化**
3. **IAM と管理** → **サービスアカウント** → **作成**（名前は例: `mahjong-drive-sync`。ロールは不要）
4. 作成したサービスアカウント → **鍵** → **鍵を追加** → **JSON** → ファイルがダウンロードされます
5. サービスアカウントのメールアドレス（`...@...iam.gserviceaccount.com`）を控えておく

> 鍵ファイルはパスワードと同じ扱いです。リポジトリにコミットしたり、チャットに貼ったりしないでください。

### 3. ドライブのフォルダを共有する

1. 集計表を置くフォルダを開き、**共有** で手順2のメールアドレスを **閲覧者** として追加
2. フォルダの URL `https://drive.google.com/drive/folders/XXXXXXXX` の `XXXXXXXX` がフォルダ ID

同期は読み取り専用の権限（`drive.readonly`）しか使いません。

### 4. 本番用リポジトリに push するためのトークンを作る

Vercel は managemahjongmatasny を見ているため、そちらにも push する必要があります。

1. GitHub → 右上アイコン → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. Repository access: **Only select repositories** → `managemahjongmatasny`
3. Permissions → Repository permissions → **Contents: Read and write**
4. 有効期限は任意（期限が切れたら作り直して手順5の値を更新）

### 5. ManageMahjongData に Secrets を登録する

ManageMahjongData → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| 名前 | 値 |
| --- | --- |
| `DRIVE_FOLDER_ID` | 手順3のフォルダ ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | 手順2の JSON ファイルの中身をすべて貼り付け |
| `DEPLOY_REPO_TOKEN` | 手順4のトークン |

### 6. 動作確認

1. ManageMahjongData → **Actions** → **Google ドライブ同期** → **Run workflow**
2. まず **「確認のみ」にチェック**して実行し、サマリーに出る「追加・紐付け」の内容を確認
3. 問題なければチェックを外して実行。初回は既存ブックへの紐付けで data.json が更新されます

## 運用上の注意

- **手元から push する前に `git pull`** してください。自動同期が main にコミットしているため、そのままでは push が拒否されます
- 日付の設定・名前の表記ゆれなど、アプリのファイル管理で行う修正は従来どおり「data.json をダウンロード → 置き換え → コミット」で反映します。同期はそれらの修正を上書きしません
- アプリ側に未共有の下書きがある状態で自動同期が走ると、次に開いたとき下書きは破棄されます（data.json が新しくなるため）。下書きは早めに反映してください
- ManageMahjongData は公開リポジトリのため、data.json（プレイヤー名を含む）は誰でも閲覧できます。Secrets の値は公開されません

## 手元で試す

```bash
DRIVE_FOLDER_ID=XXXXXXXX GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/key.json npm run sync:drive -- --dry-run
```

`--dry-run` を外すと `public/data.json` を書き換えます（コミットはしません）。
