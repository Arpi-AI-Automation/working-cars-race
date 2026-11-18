import { useEffect, useState } from 'react'

import { primeAudio } from '../sound'
import { useStore } from '../store'
import { formatTime } from '../lap'
import { RACE_LAPS, VEHICLES, vehicleById, vehicleIcon } from '../vehicles'
import type { VehicleId } from '../vehicles'

const PLAYER_LABELS = [
  { en: 'Player 1', ja: 'プレイヤー1', hint: '8 すすむ · 5 ブレーキ · 4 ひだり · 6 みぎ', keys: 'Numpad or arrow keys' },
  { en: 'Player 2', ja: 'プレイヤー2', hint: 'D すすむ · X ブレーキ · Z ひだり · C みぎ', keys: 'D X Z C' },
] as const

function VehicleCard({ id, selected, onPick }: { id: VehicleId; selected: boolean; onPick: (id: VehicleId) => void }): JSX.Element {
  const vehicle = vehicleById(id)
  return (
    <button
      type="button"
      className={`card ${selected ? 'selected' : ''}`}
      style={{ borderColor: selected ? vehicle.color : undefined }}
      onClick={() => onPick(id)}
    >
      <span className="card-swatch" style={{ background: vehicle.color }} />
      <img src={vehicleIcon(id)} alt="" width={96} height={96} />
      <span className="card-en">{vehicle.en}</span>
      <span className="card-ja">{vehicle.ja}</span>
    </button>
  )
}

export function Menu(): JSX.Element {
  const speed = useStore((state) => state.speed)
  const sound = useStore((state) => state.sound)
  const setSpeed = useStore((state) => state.setSpeed)
  const toggleSound = useStore((state) => state.toggleSound)
  const openGarage = useStore((state) => state.openGarage)

  return (
    <div className="screen menu-screen">
      <p className="eyebrow">Tomica-style はたらく車</p>
      <h1>
        はたらく車レース
        <small>Working Cars Race</small>
      </h1>
      <p className="lede">Pick a working vehicle and drive the desert track. Practice is just for fun. A race is the first to {RACE_LAPS} laps.</p>
      <div className="choice-row">
        <button type="button" className="big practice" onClick={() => openGarage('practice')}>
          <span className="ja">れんしゅう</span>
          <span className="en">Practice</span>
        </button>
        <button type="button" className="big race" onClick={() => openGarage('race')}>
          <span className="ja">2人レース</span>
          <span className="en">Two-player race</span>
        </button>
      </div>
      <div className="speed-row" role="group" aria-label="Speed">
        <span>はやさ Speed</span>
        <button type="button" className={speed === 'gentle' ? 'on' : ''} onClick={() => setSpeed('gentle')}>
          ゆっくり Gentle
        </button>
        <button type="button" className={speed === 'fast' ? 'on' : ''} onClick={() => setSpeed('fast')}>
          はやい Faster
        </button>
        <button type="button" className={sound ? 'on' : ''} onClick={toggleSound}>
          {sound ? 'おと On' : 'おと Off'}
        </button>
      </div>
      <footer className="credits">
        <p>Driving is easy on purpose: gentle speed is slower, steering is wide, and a flipped car pops back upright.</p>
        <p>
          Code from <a href="https://github.com/pmndrs/racing-game">pmndrs/racing-game</a> (MIT). Vehicles from{' '}
          <a href="https://kenney.nl/assets/car-kit">Kenney Car Kit</a> (CC0). Track by Batuhan13 (CC-BY-4.0). See CREDITS.md.
        </p>
      </footer>
    </div>
  )
}

export function Garage(): JSX.Element {
  const mode = useStore((state) => state.mode)
  const begin = useStore((state) => state.begin)
  const backToMenu = useStore((state) => state.backToMenu)
  const [picks, setPicks] = useState<[VehicleId | null, VehicleId | null]>([null, null])
  const seats = mode === 'race' ? 2 : 1
  const ready = picks.slice(0, seats).every((pick) => pick != null)

  const choose = (seat: number, id: VehicleId) => {
    setPicks((current) => {
      const next: [VehicleId | null, VehicleId | null] = [current[0], current[1]]
      next[seat] = id
      return next
    })
  }

  const start = () => {
    if (!ready) return
    primeAudio()
    const ids = picks.slice(0, seats).filter((id): id is VehicleId => id != null)
    begin(ids)
  }

  return (
    <div className="screen garage-screen">
      <header className="garage-head">
        <button type="button" className="texty" onClick={backToMenu}>
          ← メニュー
        </button>
        <h1>{mode === 'race' ? 'くるまを えらぼう' : 'どの くるま？'}</h1>
        <p>{mode === 'race' ? 'Each driver picks a working vehicle. The same one is fine.' : 'Choose one vehicle. There is no score to beat.'}</p>
      </header>
      <div className={`garages seats-${seats}`}>
        {Array.from({ length: seats }, (_, seat) => (
          <section key={seat} className="garage-seat">
            <h2>
              <span>{PLAYER_LABELS[seat].ja}</span>
              <small>{PLAYER_LABELS[seat].en}</small>
            </h2>
            <div className="card-grid">
              {VEHICLES.map((vehicle) => (
                <VehicleCard key={vehicle.id} id={vehicle.id} selected={picks[seat] === vehicle.id} onPick={(id) => choose(seat, id)} />
              ))}
            </div>
            <p className="keys">
              {PLAYER_LABELS[seat].hint}
              <small>{PLAYER_LABELS[seat].keys}</small>
            </p>
          </section>
        ))}
      </div>
      <button type="button" className="big go" disabled={!ready} onClick={start}>
        <span className="ja">{mode === 'race' ? 'レース スタート' : 'ドライブ'}</span>
        <span className="en">{mode === 'race' ? 'Start race' : 'Start practice'}</span>
      </button>
    </div>
  )
}

function Flash({ message, at }: { message: string | null; at: number }): JSX.Element | null {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), 1600)
    return () => window.clearTimeout(id)
  }, [message, at])
  if (!visible || !message) return null
  return <p className="flash">{message}</p>
}

function Clock({ startedAt }: { startedAt: number | null }): JSX.Element {
  const [label, setLabel] = useState(formatTime(null))
  useEffect(() => {
    if (startedAt == null) {
      setLabel(formatTime(null))
      return
    }
    const tick = () => setLabel(formatTime(Date.now() - startedAt))
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [startedAt])
  return <strong className="time">{label}</strong>
}

export function Hud(): JSX.Element {
  const mode = useStore((state) => state.mode)
  const players = useStore((state) => state.players)
  const backToGarage = useStore((state) => state.backToGarage)
  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth

  return (
    <div className={`hud ${mode} ${portrait ? 'portrait' : 'landscape'}`}>
      {mode === 'race' && <div className="split-line" />}
      {players.map((player, index) => {
        const vehicle = vehicleById(player.vehicleId)
        return (
          <section key={player.id} className={`panel panel-${index}`}>
            <header>
              <span className="who">
                {PLAYER_LABELS[index].ja}
                <small>{vehicle.ja}</small>
              </span>
              <span className="laps">{mode === 'race' ? `${player.lap.lap} / ${RACE_LAPS}` : `ラップ ${player.lap.lap}`}</span>
            </header>
            {player.lap.armed ? <Clock startedAt={player.lap.lapStartedAt} /> : <strong className="time">{formatTime(player.lap.lastLapMs)}</strong>}
            <p className="meta">
              {player.lap.armed ? 'ラップちゅう' : 'スタートラインへ'}
              {player.lap.bestLapMs != null && <span> ベスト {formatTime(player.lap.bestLapMs)}</span>}
            </p>
            <Flash message={player.message} at={player.messageAt} />
            <p className="hint">{PLAYER_LABELS[index].hint}</p>
          </section>
        )
      })}
      <div className="hud-actions">
        <button type="button" onClick={backToGarage}>
          ガレージ
        </button>
      </div>
    </div>
  )
}

export function Winner(): JSX.Element {
  const winnerId = useStore((state) => state.winnerId)
  const players = useStore((state) => state.players)
  const rematch = useStore((state) => state.rematch)
  const backToGarage = useStore((state) => state.backToGarage)
  const backToMenu = useStore((state) => state.backToMenu)
  const winner = players.find((player) => player.id === winnerId) ?? players[0]
  const vehicle = winner ? vehicleById(winner.vehicleId) : null
  const label = winner ? PLAYER_LABELS[winner.id] : PLAYER_LABELS[0]

  return (
    <div className="winner">
      <div className="winner-card">
        <p className="eyebrow">ゴール！</p>
        <h1>
          {label.ja} の かち！
          <small>
            {label.en} wins{vehicle ? ` · ${vehicle.en} / ${vehicle.ja}` : ''}
          </small>
        </h1>
        {winner && (
          <p className="lede">
            ベスト {formatTime(winner.lap.bestLapMs)} · {RACE_LAPS} ラップ
          </p>
        )}
        <div className="choice-row">
          <button type="button" className="big race" onClick={rematch}>
            <span className="ja">もういちど</span>
            <span className="en">Race again</span>
          </button>
          <button type="button" className="big practice" onClick={backToGarage}>
            <span className="ja">ガレージ</span>
            <span className="en">Change vehicles</span>
          </button>
        </div>
        <button type="button" className="texty" onClick={backToMenu}>
          メニュー Menu
        </button>
      </div>
    </div>
  )
}

export function LoadingScreen(): JSX.Element {
  return (
    <div className="screen loading-screen">
      <h1>よみこみちゅう…</h1>
      <p>Loading the track and the working vehicles.</p>
    </div>
  )
}
