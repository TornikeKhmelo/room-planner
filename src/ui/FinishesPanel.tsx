import { useState } from 'react'
import { KITCHEN_SHAPES, useActiveItems, useStore } from '../store'
import type { FloorKind, Room, WallId, WallTiles, WorktopKind } from '../types'

// Paint, floors, tiles and kitchen finishes for the room being viewed. Plain chips and swatches:
// pick a surface, pick a colour, see it in 3D straight away.

const WALL_COLOURS = ['#f4f1ea', '#ece6da', '#e3dccf', '#d9c08e', '#d8b8a8', '#c9d3c5', '#b9c7d6', '#8f9a86', '#6b7b8c', '#4a3b33', '#2f3b33']

const FLOORS: { id: FloorKind; label: string; colours: string[] }[] = [
  { id: 'oak', label: 'Parquet', colours: ['#d8b07a', '#c99254', '#a8743f', '#8b5a35', '#5e3d26', '#b9b2a6'] },
  { id: 'chevron', label: 'Chevron', colours: ['#d8b07a', '#c99254', '#a8743f', '#8b5a35', '#5e3d26', '#b9b2a6'] },
  { id: 'plank', label: 'Wide planks', colours: ['#e0c49c', '#c99254', '#a8743f', '#8b5a35', '#9d958a', '#c9c2b8'] },
  { id: 'tile', label: 'Tiles 60×60', colours: ['#efece6', '#d9d4cb', '#bdb6ab', '#8f8a83', '#4b4a48', '#c9b59a'] },
  { id: 'bigTile', label: 'Large tiles', colours: ['#efece6', '#d9d4cb', '#bdb6ab', '#8f8a83', '#4b4a48', '#c9b59a'] },
  { id: 'microcement', label: 'Microcement', colours: ['#e2ddd4', '#d6d0c6', '#b8b2a8', '#8e8a84', '#5f5c58'] },
]

const TILE_COLOURS = ['#f4f2ee', '#e6e2db', '#d9d4cb', '#cfd6d3', '#9fb2ab', '#c9b59a', '#2f3b45', '#1f1f1f']
const GROUTS = ['#ece8e1', '#bfb9b0', '#5a5650']
const TILE_PATTERNS: { id: WallTiles['pattern']; label: string }[] = [
  { id: 'big', label: 'Large 60×120' },
  { id: 'square', label: 'Square 20×20' },
  { id: 'metro', label: 'Metro 30×10' },
]

const FRONTS = ['#f2f0eb', '#e9e6df', '#cfc6b8', '#8f9a86', '#4f5b52', '#2f3b45', '#2a2a2a']
const WOOD_FRONTS = ['#d8b07a', '#c99254', '#8b5a35']
const WORKTOPS: { id: WorktopKind; label: string; colours: string[] }[] = [
  { id: 'stone', label: 'Stone / quartz', colours: ['#f4f2ee', '#cfc9bf', '#8f8a83', '#2a2a2a'] },
  { id: 'wood', label: 'Wood', colours: ['#d8b07a', '#c99254', '#8b5a35'] },
  { id: 'concrete', label: 'Concrete', colours: ['#b8b2a8', '#8e8a84', '#5f5c58'] },
  { id: 'laminate', label: 'Laminate', colours: ['#f2f0eb', '#e8e4dc', '#2a2a2a'] },
]

const WALL_ORDER: WallId[] = ['north', 'east', 'south', 'west']

function Swatches({ colours, value, onPick, custom = true }: { colours: string[]; value: string | undefined; onPick: (c: string, live?: boolean) => void; custom?: boolean }) {
  return (
    <div className="swatches">
      {colours.map((c) => (
        <button key={c} className={value === c ? 'on' : ''} style={{ background: c }} title={c} onClick={() => onPick(c)} />
      ))}
      {custom && (
        <label style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} title="Any colour">
          <input type="color" value={value ?? '#ffffff'} onFocus={() => useStore.getState().checkpoint()} onChange={(e) => onPick(e.target.value, true)} />
        </label>
      )}
    </div>
  )
}

function Chips<T extends string>({ options, value, onPick }: { options: { id: T; label: string }[]; value: T | undefined; onPick: (id: T) => void }) {
  return (
    <div className="chip-row">
      {options.map((o) => (
        <button key={o.id} className={`chip${value === o.id ? ' on' : ''}`} onClick={() => onPick(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

const wallLabel = (room: Room, w: WallId) => {
  const name = room.wallNames?.[w]
  return name ? name[0].toUpperCase() + name.slice(1) : `${w[0].toUpperCase()}${w.slice(1)} wall`
}

export function FinishesPanel() {
  const room = useStore((s) => s.room)
  const updateRoom = useStore((s) => s.updateRoom)
  const updateKitchen = useStore((s) => s.updateKitchen)
  const items = useActiveItems()
  const [wallSel, setWallSel] = useState<'all' | WallId>('all')

  const set = (patch: Partial<Room>, live?: boolean) => {
    if (!live) useStore.getState().checkpoint()
    updateRoom(patch)
  }

  // ---- walls
  const wallValue = wallSel === 'all' ? room.wallColor : (room.wallColors?.[wallSel] ?? room.wallColor)
  const pickWall = (c: string, live?: boolean) => {
    if (wallSel === 'all') set({ wallColor: c, wallColors: {} }, live)
    else set({ wallColors: { ...room.wallColors, [wallSel]: c } }, live)
  }

  // ---- floor
  const floorKind = room.floorKind ?? 'oak'
  const floor = FLOORS.find((f) => f.id === floorKind) ?? FLOORS[0]
  const pickFloorKind = (id: FloorKind) => {
    const next = FLOORS.find((f) => f.id === id)!
    // Keep the colour when it suits the new material, otherwise take that material's typical colour.
    const colour = next.colours.includes(room.floorColor) ? room.floorColor : next.colours[1] ?? next.colours[0]
    set({ floorKind: id, floorColor: colour })
  }

  // ---- tiles
  const tiles = room.tiles
  const tiled = !!tiles && tiles.walls.length > 0 && tiles.height > 0
  const setTiles = (patch: Partial<WallTiles>, live?: boolean) =>
    set({ tiles: { walls: WALL_ORDER, height: 220, color: '#e6e2db', grout: '#bfb9b0', pattern: 'big', ...tiles, ...patch } }, live)

  // ---- kitchen
  const kitchen = items.filter((i) => (KITCHEN_SHAPES as readonly string[]).includes(i.shape))
  const k0 = kitchen[0]
  const worktopKind = k0?.worktop ?? 'stone'
  const worktop = WORKTOPS.find((w) => w.id === worktopKind) ?? WORKTOPS[0]

  return (
    <div>
      <h3 className="section-title">Wall paint</h3>
      <Chips
        options={[{ id: 'all' as const, label: 'All walls' }, ...WALL_ORDER.map((w) => ({ id: w, label: wallLabel(room, w) }))]}
        value={wallSel}
        onPick={setWallSel}
      />
      <Swatches colours={WALL_COLOURS} value={wallValue} onPick={pickWall} />
      {wallSel !== 'all' && room.wallColors?.[wallSel] && (
        <button className="link-btn" onClick={() => set({ wallColors: { ...room.wallColors, [wallSel]: undefined } })}>
          Same as the other walls
        </button>
      )}

      <h3 className="section-title">Floor</h3>
      <Chips options={FLOORS} value={floorKind} onPick={pickFloorKind} />
      <Swatches colours={floor.colours} value={room.floorColor} onPick={(c, live) => set({ floorColor: c }, live)} />

      <h3 className="section-title">Wall tiles</h3>
      <Chips
        options={[
          { id: 'none', label: 'No tiles' },
          { id: '120', label: 'Up to 120 cm' },
          { id: '220', label: 'Up to 220 cm' },
          { id: 'full', label: 'Floor to ceiling' },
        ]}
        value={!tiled ? 'none' : tiles!.height >= room.height ? 'full' : String(tiles!.height)}
        onPick={(id) => (id === 'none' ? set({ tiles: tiles ? { ...tiles, height: 0 } : undefined }) : setTiles({ height: id === 'full' ? room.height : Number(id), walls: tiles?.walls.length ? tiles.walls : WALL_ORDER }))}
      />
      {tiled && (
        <>
          <Chips options={TILE_PATTERNS} value={tiles!.pattern} onPick={(pattern) => setTiles({ pattern })} />
          <div className="form-label">Tile colour</div>
          <Swatches colours={TILE_COLOURS} value={tiles!.color} onPick={(color, live) => setTiles({ color }, live)} />
          <div className="form-label">Grout</div>
          <Swatches colours={GROUTS} value={tiles!.grout} onPick={(grout) => setTiles({ grout })} custom={false} />
          <div className="form-label">Tiled walls</div>
          <div className="chip-row">
            {WALL_ORDER.map((w) => {
              const on = tiles!.walls.includes(w)
              return (
                <button key={w} className={`chip${on ? ' on' : ''}`} onClick={() => setTiles({ walls: on ? tiles!.walls.filter((x) => x !== w) : [...tiles!.walls, w] })}>
                  {wallLabel(room, w)}
                </button>
              )
            })}
          </div>
        </>
      )}

      {k0 && (
        <>
          <h3 className="section-title">Kitchen fronts</h3>
          <Chips
            options={[
              { id: 'painted', label: 'Matt lacquer' },
              { id: 'wood', label: 'Wood veneer' },
            ]}
            value={k0.finish === 'wood' ? 'wood' : 'painted'}
            onPick={(id) => updateKitchen(id === 'wood' ? { finish: 'wood', color: WOOD_FRONTS.includes(k0.color) ? k0.color : WOOD_FRONTS[1] } : { finish: 'painted', color: FRONTS.includes(k0.color) ? k0.color : FRONTS[1] })}
          />
          <Swatches colours={k0.finish === 'wood' ? WOOD_FRONTS : FRONTS} value={k0.color} onPick={(color) => updateKitchen({ color })} />
          <h3 className="section-title">Worktop</h3>
          <Chips options={WORKTOPS} value={worktopKind} onPick={(id) => updateKitchen({ worktop: id, color2: WORKTOPS.find((w) => w.id === id)!.colours[0] })} />
          <Swatches colours={worktop.colours} value={k0.color2} onPick={(color2) => updateKitchen({ color2 })} />
        </>
      )}
    </div>
  )
}
