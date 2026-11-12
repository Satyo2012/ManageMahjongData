import { useMemo, useState } from 'react'
import { ArrowLeftRight, Swords } from 'lucide-react'
import type { MahjongData } from '../types'
import { computeHeadToHead } from '../domain/headToHead'
import { Section } from '../components/ui/Section'
import { H2HSummary } from '../components/h2h/H2HSummary'
import { H2H_COLORS } from '../theme/chartTheme'
import { H2HCharts } from '../components/h2h/H2HCharts'
import { H2HHistoryTable } from '../components/h2h/H2HHistoryTable'

interface Props {
  data: MahjongData
}

function PlayerSelect({ value, exclude, players, color, onChange, label }: {
  value: string
  exclude: string
  players: string[]
  color: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input py-2 min-w-[160px] font-bold"
      style={{ color }}
    >
      {players.map((p) => (
        <option key={p} value={p} disabled={p === exclude} className="text-white">
          {p}
        </option>
      ))}
    </select>
  )
}

export function HeadToHead({ data }: Props) {
  const players = data.players
  const [selectedA, setSelectedA] = useState('')
  const [selectedB, setSelectedB] = useState('')

  // 初期値は対局数の多い2人。期間変更で選択中の人がいなくなった場合も同様
  const playerA = players.includes(selectedA) ? selectedA : players[0] ?? ''
  const playerB = players.includes(selectedB) && selectedB !== playerA ? selectedB : players.find((p) => p !== playerA) ?? ''

  const h2h = useMemo(
    () => (playerA && playerB ? computeHeadToHead(playerA, playerB, data.games) : null),
    [playerA, playerB, data.games],
  )

  const swap = () => {
    setSelectedA(playerB)
    setSelectedB(playerA)
  }

  return (
    <div className="space-y-6">
      <Section icon={Swords} title="直対戦績">
        <div className="flex items-center gap-3 flex-wrap">
          <PlayerSelect label="プレイヤーA" value={playerA} exclude={playerB} players={players} color={H2H_COLORS.a} onChange={setSelectedA} />
          <button type="button" onClick={swap} className="btn-ghost px-2" title="入れ替え" aria-label="プレイヤーを入れ替え">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <PlayerSelect label="プレイヤーB" value={playerB} exclude={playerA} players={players} color={H2H_COLORS.b} onChange={setSelectedB} />
        </div>
      </Section>

      {!h2h && <p className="text-center text-slate-400 py-12">対戦するプレイヤーを2人選択してください</p>}

      {h2h && h2h.totalGames === 0 && (
        <p className="text-center text-slate-400 py-12">
          {playerA} と {playerB} が同卓した対局はありません
        </p>
      )}

      {h2h && h2h.totalGames > 0 && (
        <>
          <H2HSummary h2h={h2h} />
          <H2HCharts h2h={h2h} />
          <H2HHistoryTable key={`${playerA}-${playerB}`} h2h={h2h} />
        </>
      )}
    </div>
  )
}
