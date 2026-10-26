import { Eye, EyeOff, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { fitIssues } from '../geometry'
import { useActiveItems, useStore } from '../store'
import type { Item } from '../types'
import { FallbackIcon, SHAPE_ICONS } from './actions'
import { Num } from './controls'
import { FinishesPanel } from './FinishesPanel'
import { useUi } from './uiStore'


function ThingRow({ item, issue }: { item: Item; issue?: 'error' | 'warn' }) {
  const selected = useStore((s) => s.selectedId === item.id)
  const select = useStore((s) => s.select)
  const update = useStore((s) => s.updateItem)
  const Icon = SHAPE_ICONS[item.shape] ?? FallbackIcon
  return (
    <div className={`row${selected ? ' on' : ''}${item.hidden ? ' dim' : ''}`} role="button" tabIndex={0} onClick={() => !item.hidden && select(item.id)}>
      <span className="thumb">{item.photo ? <img src={item.photo} alt="" /> : <Icon size={16} />}</span>
      <span className="label">{item.name}</span>
      {issue && <span className={`status-dot ${issue}`} title={issue === 'error' ? "Doesn't fit" : 'Worth a look'} />}
      <span className="meta">
        {item.size.w}×{item.place.type === 'wall' ? item.size.h : item.size.d}
      </span>
      <button
        className="icon-btn"
        title={item.hidden ? 'Show it again' : 'Hide for now'}
        onClick={(e) => {
          e.stopPropagation()
          useStore.getState().checkpoint()
          update(item.id, { hidden: !item.hidden })
          if (!item.hidden && selected) select(null)
        }}
      >
        {item.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export function RoomTab() {
  const room = useStore((s) => s.room)
  const resizeRoom = useStore((s) => s.resizeRoom)
  const resetAll = useStore((s) => s.resetAll)
  const items = useActiveItems()
  const roomKey = useStore((s) => s.activeRoomId)
  const issues = useMemo(() => fitIssues(room, items), [room, items])
  const worst = (id: string) => {
    const list = issues.get(id)
    if (!list?.length) return undefined
    return list.some((i) => i.severity === 'error') ? 'error' : 'warn'
  }
  const furniture = items.filter((i) => i.place.type === 'floor' && !i.fixture)
  const walls = items.filter((i) => i.place.type === 'wall' && !i.fixture)

  return (
    <div>
      <FinishesPanel key={roomKey} />

      <h3 className="section-title">Room size</h3>
      <div className="size-row">
        {(
          [
            ['Width', 'width', 100, 2000],
            ['Length', 'depth', 100, 2000],
            ['Height', 'height', 150, 600],
          ] as const
        ).map(([label, f, min, max]) => (
          <div key={f} className="unit-field">
            <div className="form-label">{label}</div>
            <Num value={room[f]} min={min} max={max} lazy onChange={(v) => resizeRoom({ [f]: v })} undoKey={`room:${f}`} />
            <span>cm</span>
          </div>
        ))}
      </div>
      <div className="callout warn" style={{ marginTop: 10 }}>
        <TriangleAlert size={15} />
        <span>Measured from your plan (ნახაზი); the ceiling height is a guess. Check with a tape on site and type the real numbers here so “fits / doesn't fit” is exact.</span>
      </div>

      <h3 className="section-title">Furniture</h3>
      <div className="row-list">
        {furniture.map((i) => (
          <ThingRow key={i.id} item={i} issue={worst(i.id)} />
        ))}
      </div>
      <h3 className="section-title">On the walls</h3>
      <div className="row-list">
        {walls.map((i) => (
          <ThingRow key={i.id} item={i} issue={worst(i.id)} />
        ))}
      </div>

      <button className="btn ghost wide" style={{ marginTop: 18 }} onClick={() => confirm('Go back to the room as it was first modelled? You can undo this.') && resetAll()}>
        <RotateCcw size={15} /> Start over
      </button>
    </div>
  )
}

/** Room size, colours and the list of things, behind the gear button: out of the way until needed. */
export function RoomSettingsDialog() {
  const open = useUi((s) => s.settingsOpen)
  const setOpen = useUi((s) => s.setSettingsOpen)
  const roomName = useStore((s) => s.room.name)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])
  if (!open) return null
  return (
    <div className="side-panel-wrap">
      <div className="dialog side-panel" role="dialog" aria-label="Finishes and room">
        <div className="dialog-head">
          <h2>{roomName}</h2>
          <button className="icon-btn" onClick={() => setOpen(false)} title="Close">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">
          <RoomTab />
        </div>
      </div>
    </div>
  )
}
