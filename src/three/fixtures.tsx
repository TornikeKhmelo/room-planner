import * as THREE from 'three'
import type { Item } from '../types'
import type { MatKind } from './materials'
import { Ball, Cyl, Part } from './parts'

// Kitchen and bathroom pieces. Same conventions as models.tsx: metres, floor models stand on y = 0
// centred on their footprint with the front facing +z; wall models hang from the wall (z = 0) with
// their bottom edge at y = 0.

const CHROME = '#d0d0d0'
const BLACK_GLASS = '#151515'

function sizeM(item: Item) {
  return { w: item.size.w / 100, d: item.size.d / 100, h: item.size.h / 100 }
}

/** Fronts: wood veneer when the finish says so, otherwise matt lacquer. */
function frontMat(item: Item): MatKind {
  return item.finish === 'wood' ? 'wood' : 'laminate'
}

export function worktopMat(item: Item): MatKind {
  switch (item.worktop) {
    case 'wood':
      return 'wood'
    case 'concrete':
      return 'concrete'
    case 'laminate':
      return 'laminate'
    default:
      return 'stone'
  }
}

const darker = (hex: string, f = 0.6) => new THREE.Color(hex).multiplyScalar(f).getStyle()

/** A row of cabinet doors across a front, with thin gaps and slim bar handles. */
function Fronts({ item, w, y0, y1, z, handle = 'top' }: { item: Item; w: number; y0: number; y1: number; z: number; handle?: 'top' | 'bottom' | 'side' }) {
  const n = Math.max(1, Math.round(w / 0.6))
  const fw = w / n
  const gap = 0.003
  const h = y1 - y0
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -w / 2 + fw * (i + 0.5)
        const hy = handle === 'top' ? y1 - 0.05 : handle === 'bottom' ? y0 + 0.05 : y0 + h / 2
        return (
          <group key={i}>
            <Part size={[fw - gap, h - gap, 0.018]} radius={0.002} mat={frontMat(item)} color={item.color} pos={[x, y0 + h / 2, z + 0.009]} />
            {handle === 'side' ? (
              <Part size={[0.012, Math.min(0.5, h * 0.4), 0.012]} radius={0.004} mat="metal" color="#8d8d8d" pos={[x + (i % 2 ? -1 : 1) * (fw / 2 - 0.04), hy, z + 0.026]} />
            ) : (
              <Part size={[Math.min(0.32, fw * 0.55), 0.012, 0.012]} radius={0.004} mat="metal" color="#8d8d8d" pos={[x, hy, z + 0.026]} />
            )}
          </group>
        )
      })}
    </group>
  )
}

function Sink({ x, top, d }: { x: number; top: number; d: number }) {
  return (
    <group position={[x, top, -d / 2 + 0.3]}>
      <Part size={[0.5, 0.004, 0.4]} radius={0.01} mat="metal" color="#b9b9b9" pos={[0, 0.001, 0]} shadow={false} />
      <Part size={[0.44, 0.003, 0.34]} radius={0.02} mat="metal" color="#4a4a4a" pos={[0, 0.003, 0]} shadow={false} />
      <group position={[0, 0, -0.24]}>
        <Cyl r={0.025} h={0.06} mat="chrome" color={CHROME} pos={[0, 0.03, 0]} />
        <Cyl r={0.012} h={0.28} mat="chrome" color={CHROME} pos={[0, 0.2, 0]} />
        <Cyl r={0.011} h={0.18} mat="chrome" color={CHROME} pos={[0, 0.33, 0.08]} rot={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
  )
}

function Hob({ x, top, d }: { x: number; top: number; d: number }) {
  return (
    <group position={[x, top, -d / 2 + 0.3]}>
      <Part size={[0.6, 0.008, 0.52]} radius={0.004} mat="glass" color="#000000" pos={[0, 0.004, 0]} shadow={false} />
      <Part size={[0.6, 0.006, 0.52]} radius={0.004} mat="gloss" color={BLACK_GLASS} pos={[0, 0.003, 0]} shadow={false} />
      {[
        [-0.14, -0.12, 0.1],
        [0.14, -0.12, 0.08],
        [-0.14, 0.12, 0.08],
        [0.14, 0.12, 0.1],
      ].map(([px, pz, r], i) => (
        <Cyl key={i} r={r} h={0.001} mat="plastic" color="#3a3a3a" pos={[px, 0.008, pz]} segments={32} />
      ))}
    </group>
  )
}

/** Base cabinets with plinth and worktop; style 'sink' or 'hob' adds the sink or a hob with an oven below. */
export function KitchenBase({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const plinth = 0.1
  const top = 0.04
  const body = h - top
  const top2 = item.color2 ?? '#cfc9bf'
  const sinkX = -w / 2 + Math.min(w / 2, Math.max(0.4, w * 0.3))
  return (
    <group>
      <Part size={[w - 0.01, plinth, d - 0.08]} mat="plastic" color={darker(item.color, 0.45)} pos={[0, plinth / 2, -0.04]} />
      <Part size={[w, body - plinth, d - 0.04]} mat="laminate" color={darker(item.color, 0.9)} pos={[0, plinth + (body - plinth) / 2, -0.02]} />
      <Fronts item={item} w={w} y0={plinth} y1={body} z={d / 2 - 0.02} />
      {item.style === 'hob' && (
        <group position={[0, 0, d / 2 + 0.002]}>
          <Part size={[0.595, 0.58, 0.02]} radius={0.003} mat="gloss" color={BLACK_GLASS} pos={[0, plinth + 0.33, 0]} />
          <Part size={[0.5, 0.012, 0.015]} radius={0.005} mat="chrome" color={CHROME} pos={[0, plinth + 0.58, 0.02]} />
        </group>
      )}
      <Part size={[w + 0.01, top, d + 0.01]} radius={0.003} mat={worktopMat(item)} color={top2} pos={[0, body + top / 2, 0]} />
      {item.style === 'sink' && <Sink x={sinkX} top={h} d={d} />}
      {item.style === 'hob' && <Hob x={0} top={h} d={d} />}
    </group>
  )
}

/** Floor-to-ceiling unit: built-in fridge ('fridge') or oven + microwave ('oven'). */
export function KitchenTall({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const plinth = 0.1
  const z = d / 2 - 0.02
  return (
    <group>
      <Part size={[w - 0.01, plinth, d - 0.08]} mat="plastic" color={darker(item.color, 0.45)} pos={[0, plinth / 2, -0.04]} />
      <Part size={[w, h - plinth, d - 0.04]} mat="laminate" color={darker(item.color, 0.9)} pos={[0, plinth + (h - plinth) / 2, -0.02]} />
      {item.style === 'oven' ? (
        <group>
          <Fronts item={item} w={w} y0={plinth} y1={0.82} z={z} />
          <Part size={[w - 0.01, 0.58, 0.02]} radius={0.003} mat="gloss" color={BLACK_GLASS} pos={[0, 1.12, z + 0.01]} />
          <Part size={[w - 0.01, 0.38, 0.02]} radius={0.003} mat="gloss" color={BLACK_GLASS} pos={[0, 1.62, z + 0.01]} />
          <Fronts item={item} w={w} y0={1.82} y1={h} z={z} handle="bottom" />
        </group>
      ) : (
        <group>
          <Fronts item={item} w={w} y0={plinth} y1={0.8} z={z} handle="side" />
          <Fronts item={item} w={w} y0={0.8} y1={h - 0.4} z={z} handle="side" />
          <Fronts item={item} w={w} y0={h - 0.4} y1={h} z={z} handle="bottom" />
        </group>
      )}
    </group>
  )
}

/** Wall cabinets with a light strip underneath. */
export function KitchenWall({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  return (
    <group>
      <Part size={[w, h, d - 0.02]} mat="laminate" color={darker(item.color, 0.9)} pos={[0, h / 2, (d - 0.02) / 2]} />
      <Fronts item={item} w={w} y0={0} y1={h} z={d - 0.02} handle="bottom" />
      <Part size={[w - 0.1, 0.008, 0.02]} mat="emissive" color="#fff2d8" pos={[0, -0.004, d - 0.08]} shadow={false} />
    </group>
  )
}

/** Island: cabinets on the back (-z), worktop overhanging the front (+z) for stools. */
export function Island({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const over = Math.min(0.3, d * 0.3)
  const bd = d - over
  const top = 0.04
  const body = h - top
  const plinth = 0.1
  return (
    <group>
      <Part size={[w - 0.04, plinth, bd - 0.06]} mat="plastic" color={darker(item.color, 0.45)} pos={[0, plinth / 2, -d / 2 + bd / 2]} />
      <Part size={[w, body - plinth, bd]} mat={frontMat(item)} color={item.color} pos={[0, plinth + (body - plinth) / 2, -d / 2 + bd / 2]} />
      <group rotation={[0, Math.PI, 0]}>
        <Fronts item={item} w={w} y0={plinth} y1={body} z={d / 2} />
      </group>
      <Part size={[w + 0.02, top, d]} radius={0.004} mat={worktopMat(item)} color={item.color2 ?? '#cfc9bf'} pos={[0, body + top / 2, 0]} />
      {[-1, 1].map((sx) => (
        <Part key={sx} size={[0.04, body, d]} mat={worktopMat(item)} color={item.color2 ?? '#cfc9bf'} pos={[sx * (w / 2 - 0.01), body / 2, 0]} />
      ))}
    </group>
  )
}

export function BarStool({ item }: { item: Item }) {
  const { w, h } = sizeM(item)
  const r = w / 2
  return (
    <group>
      <Cyl r={r * 0.95} r2={r} h={0.05} mat="upholstery" color={item.color2 ?? '#b08d6a'} pos={[0, h - 0.025, 0]} segments={28} />
      <Cyl r={r * 0.8} h={0.01} mat="metal" color={item.color} pos={[0, h * 0.32, 0]} segments={28} />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4
        return <Cyl key={i} r={0.011} h={h - 0.05} mat="paintedMetal" color={item.color} pos={[Math.cos(a) * r * 0.72, (h - 0.05) / 2, Math.sin(a) * r * 0.72]} />
      })}
    </group>
  )
}

// ---------------------------------------------------------------- bathroom

/** Built-in bath: tiled-in sides, a hollow basin with a sloped back, and a wall tap. */
export function Bathtub({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const rim = 0.07
  const floorY = 0.14
  const inner = '#eef1f1'
  return (
    <group>
      {[-1, 1].map((s) => (
        <Part key={`x${s}`} size={[rim, h, d]} radius={0.01} mat="ceramic" color={item.color} pos={[s * (w / 2 - rim / 2), h / 2, 0]} />
      ))}
      {[-1, 1].map((s) => (
        <Part key={`z${s}`} size={[w - 2 * rim + 0.002, h, rim]} radius={0.01} mat="ceramic" color={item.color} pos={[0, h / 2, s * (d / 2 - rim / 2)]} />
      ))}
      <Part size={[w - 2 * rim, floorY, d - 2 * rim]} mat="ceramic" color={item.color} pos={[0, floorY / 2, 0]} />
      <Part size={[w - 2 * rim - 0.04, 0.01, d - 2 * rim - 0.04]} radius={0.004} mat="ceramic" color={inner} pos={[0, floorY + 0.005, 0]} shadow={false} />
      <Part size={[w - 2 * rim - 0.02, 0.004, 0.003]} mat="chrome" color={CHROME} pos={[0, floorY + 0.012, d / 2 - rim - 0.12]} shadow={false} />
      <group position={[0, h + 0.18, -d / 2 + 0.01]}>
        <Part size={[0.2, 0.05, 0.05]} radius={0.015} mat="chrome" color={CHROME} />
        <Cyl r={0.012} h={0.1} mat="chrome" color={CHROME} pos={[0, -0.04, 0.06]} rot={[Math.PI / 2, 0, 0]} />
        <Cyl r={0.008} h={0.9} mat="chrome" color={CHROME} pos={[w / 2 - 0.15, 0.6, 0.03]} />
        <Cyl r={0.06} h={0.012} mat="chrome" color={CHROME} pos={[w / 2 - 0.15, 1.05, 0.1]} />
      </group>
    </group>
  )
}

/** Walk-in shower: low tray, a glass screen on the open side and a rain head. */
export function Shower({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  return (
    <group>
      <Part size={[w, 0.04, d]} radius={0.006} mat="ceramic" color={item.color} pos={[0, 0.02, 0]} />
      <Part size={[0.12, 0.002, 0.04]} mat="chrome" color="#9a9a9a" pos={[0, 0.041, d / 2 - 0.1]} shadow={false} />
      <Part size={[w * 0.6, h - 0.04, 0.008]} mat="glass" color="#dfeaf2" pos={[w * 0.2, 0.04 + (h - 0.04) / 2, d / 2 - 0.01]} shadow={false} />
      <Part size={[0.012, h - 0.04, 0.02]} mat="chrome" color={CHROME} pos={[-w * 0.1, 0.04 + (h - 0.04) / 2, d / 2 - 0.01]} />
      <Cyl r={0.01} h={h - 0.2} mat="chrome" color={CHROME} pos={[0, (h - 0.2) / 2 + 0.1, -d / 2 + 0.03]} />
      <Cyl r={0.13} h={0.01} mat="chrome" color={CHROME} pos={[0, h, -d / 2 + 0.2]} segments={32} />
      <Part size={[0.012, 0.012, 0.18]} mat="chrome" color={CHROME} pos={[0, h, -d / 2 + 0.11]} />
    </group>
  )
}

/** Wall-hung toilet with a concealed cistern (box behind) and a flush plate. */
export function Toilet({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const back = 0.16
  return (
    <group>
      <Part size={[w + 0.12, 1.1, back]} mat="laminate" color="#e7e3dc" pos={[0, 0.55, -d / 2 + back / 2 - 0.12]} />
      <Part size={[0.22, 0.14, 0.01]} radius={0.004} mat="gloss" color="#f5f5f5" pos={[0, 0.98, -d / 2 + back - 0.115]} />
      <group position={[0, h - 0.16, 0.04]}>
        <Ball r={0.5} mat="ceramic" color={item.color} scale={[w, 0.3, d - 0.08]} />
        <Part size={[w * 0.7, 0.16, 0.16]} radius={0.04} mat="ceramic" color={item.color} pos={[0, 0.02, -(d - 0.08) / 2 + 0.04]} />
      </group>
      <Part size={[w * 0.98, 0.02, d - 0.12]} radius={0.01} mat="gloss" color={item.color} pos={[0, h, 0.05]} />
    </group>
  )
}

/** Wall-hung vanity (colour 2) with a ceramic basin top and a chrome tap. */
export function Basin({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  const topT = 0.05
  const cab = 0.45
  const vanity = item.color2 ?? '#b98b5e'
  return (
    <group>
      <Part size={[w, cab, d - 0.02]} radius={0.004} mat={item.finish === 'painted' ? 'laminate' : 'wood'} color={vanity} pos={[0, h - topT - cab / 2, -0.01]} />
      <Part size={[w * 0.96, 0.003, 0.002]} mat="plastic" color={darker(vanity, 0.5)} pos={[0, h - topT - cab / 2, d / 2 - 0.019]} shadow={false} />
      <Part size={[w, topT, d]} radius={0.01} mat="ceramic" color={item.color} pos={[0, h - topT / 2, 0]} />
      <Part size={[w * 0.7, 0.004, d * 0.6]} radius={0.04} mat="innerGloss" color="#e9eef0" pos={[0, h - 0.001, 0.02]} shadow={false} />
      <group position={[0, h, -d / 2 + 0.06]}>
        <Cyl r={0.018} h={0.16} mat="chrome" color={CHROME} pos={[0, 0.08, 0]} />
        <Cyl r={0.01} h={0.1} mat="chrome" color={CHROME} pos={[0, 0.15, 0.05]} rot={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
  )
}

export function Washer({ item }: { item: Item }) {
  const { w, d, h } = sizeM(item)
  return (
    <group>
      <Part size={[w, h, d]} radius={0.01} mat="gloss" color={item.color} pos={[0, h / 2, 0]} />
      <Part size={[w - 0.04, 0.1, 0.005]} mat="plastic" color="#dcdcdc" pos={[0, h - 0.07, d / 2 + 0.002]} />
      <Cyl r={0.022} h={0.02} mat="chrome" color={CHROME} pos={[w / 2 - 0.1, h - 0.07, d / 2 + 0.01]} rot={[Math.PI / 2, 0, 0]} />
      <Cyl r={w * 0.3} h={0.02} mat="chrome" color="#bdbdbd" pos={[0, h * 0.45, d / 2 + 0.01]} rot={[Math.PI / 2, 0, 0]} segments={40} />
      <Cyl r={w * 0.24} h={0.022} mat="glass" color="#9fb0bb" pos={[0, h * 0.45, d / 2 + 0.012]} rot={[Math.PI / 2, 0, 0]} segments={40} />
      <Cyl r={w * 0.22} h={0.004} mat="gloss" color="#2d3438" pos={[0, h * 0.45, d / 2 + 0.002]} rot={[Math.PI / 2, 0, 0]} segments={40} />
    </group>
  )
}
