import { Environment, Html, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei'
import { EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { ToneMappingMode } from 'postprocessing'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ROOMS } from '../apartment'
import { WALL_ROT_Y, wallPoint } from '../geometry'
import { useStore } from '../store'
import type { Item, PlannerState, Room } from '../types'
import { useUi } from '../ui/uiStore'
import { canvasHandle } from './handles'
import { ItemModel } from './models'
import { RoomMesh } from './RoomMesh'

// The whole flat at once: every room at its place on the plan, walls cut at SECTION so you can see
// into all of them from above. Read-only; click a room (or its label) to open it.

const SECTION = 1.25

/** Every room's current state, with the one being edited taken live from the store. */
function useRooms(): Record<string, PlannerState> {
  const rooms = useStore((s) => s.rooms)
  const activeRoomId = useStore((s) => s.activeRoomId)
  const room = useStore((s) => s.room)
  const variants = useStore((s) => s.variants)
  const activeVariantId = useStore((s) => s.activeVariantId)
  return useMemo(() => ({ ...rooms, [activeRoomId]: { version: 1, room, variants, activeVariantId } }), [rooms, activeRoomId, room, variants, activeVariantId])
}

function StaticItem({ item, room }: { item: Item; room: Room }) {
  const p = item.place
  if (p.type === 'floor') {
    return (
      <group position={[p.x / 100, 0, p.z / 100]} rotation={[0, (-p.rot * Math.PI) / 180, 0]}>
        <ItemModel item={item} />
      </group>
    )
  }
  const [x, z] = wallPoint(room, p.wall, p.along)
  return (
    <group position={[x / 100, p.elev / 100, z / 100]} rotation={[0, WALL_ROT_Y[p.wall], 0]}>
      <ItemModel item={item} />
    </group>
  )
}

function open(id: string) {
  useStore.getState().switchRoom(id)
  useUi.getState().setWhole(false)
}

function RoomBlock({ id, label, area, origin, state, index }: { id: string; label: string; area: string; origin: [number, number]; state: PlannerState; index: number }) {
  const { room } = state
  const items = state.variants.find((v) => v.id === state.activeVariantId)?.items ?? []
  // Wall items that would poke above the cut (curtains, a TV, wall cabinets) are left out.
  const visible = items.filter((i) => !i.hidden && (i.place.type === 'floor' || (i.place.elev + i.size.h) / 100 <= SECTION + 0.01))
  // Neighbouring rooms' walls overlap a little; a hair of height difference avoids flicker on the cut.
  const section = SECTION + index * 0.003
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return
    e.stopPropagation()
    open(id)
  }
  return (
    <group position={[origin[0] / 100, 0, origin[1] / 100]} onClick={onClick} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <RoomMesh room={room} section={section} floorLift={index * 0.002} />
      {visible.map((item) => (
        <StaticItem key={item.id} item={item} room={room} />
      ))}
      <Html position={[room.width / 200, SECTION + 0.35, room.depth / 200]} center zIndexRange={[10, 0]}>
        <button className="room-tag" onClick={() => open(id)}>
          <b>{label}</b>
          <span>{area}</span>
        </button>
      </Html>
    </group>
  )
}

function bounds() {
  const rooms = useStore.getState().apartment().rooms
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity
  for (const r of ROOMS) {
    const room = rooms[r.id]?.room
    if (!room) continue
    minX = Math.min(minX, r.origin[0])
    minZ = Math.min(minZ, r.origin[1])
    maxX = Math.max(maxX, r.origin[0] + room.width)
    maxZ = Math.max(maxZ, r.origin[1] + room.depth)
  }
  return { minX: minX / 100, minZ: minZ / 100, maxX: maxX / 100, maxZ: maxZ / 100 }
}

/** Frames the whole flat from above the south-east, the same angle as a room's overview. */
function Framing({ nonce }: { nonce: number }) {
  const { camera, controls, size } = useThree()
  useEffect(() => {
    const ctl = controls as unknown as { target: THREE.Vector3; update: () => void } | null
    if (!ctl || size.width < 10) return
    const b = bounds()
    const centre = new THREE.Vector3((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2)
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = 40
    cam.updateProjectionMatrix()
    const radius = Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2
    const halfV = THREE.MathUtils.degToRad(cam.fov / 2)
    const halfH = Math.atan(Math.tan(halfV) * cam.aspect)
    const dist = (radius / Math.sin(Math.min(halfV, halfH))) * 0.8
    const az = THREE.MathUtils.degToRad(20)
    const el = THREE.MathUtils.degToRad(58)
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    camera.position.copy(centre.clone().addScaledVector(dir, dist))
    ctl.target.copy(centre)
    ctl.update()
  }, [camera, controls, size.width, size.height, nonce])
  return null
}

function Content({ nonce }: { nonce: number }) {
  const rooms = useRooms()
  const background = useMemo(() => getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#ebe8e3', [])
  const b = useMemo(() => bounds(), [])
  const cx = (b.minX + b.maxX) / 2
  const cz = (b.minZ + b.maxZ) / 2
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(cx, 0, cz)
    return o
  }, [cx, cz])
  const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2 + 1
  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.25} color="#fff6ea" />
      <Environment resolution={256} frames={1} environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={2.4} color="#fff1dc" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#dbe6ff" position={[-7, 2, 1]} rotation-y={Math.PI / 2} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe2c0" position={[7, 2, -1]} rotation-y={-Math.PI / 2} scale={[5, 3, 1]} />
      </Environment>
      <primitive object={target} />
      <directionalLight
        position={[cx + 4, 12, cz + 6]}
        target={target}
        intensity={1.6}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      {ROOMS.map((r, i) =>
        rooms[r.id] ? <RoomBlock key={r.id} id={r.id} label={r.label} area={r.area} origin={r.origin} state={rooms[r.id]} index={i} /> : null,
      )}
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2 - 0.04} minDistance={1} maxDistance={40} />
      <Framing nonce={nonce} />
      <SoftShadows size={18} samples={10} focus={0.6} />
      <EffectComposer multisampling={4}>
        <N8AO aoRadius={0.45} distanceFalloff={0.8} intensity={2} quality="medium" halfRes color="#1a120c" />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

export function ApartmentScene({ nonce = 0 }: { nonce?: number }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: 40, near: 0.3, far: 120, position: [25, 15, 25] }}
      onCreated={(state) => {
        canvasHandle.current = state.gl.domElement
        // Cut everything (tall wardrobes, the fridge column) at the same height as the walls.
        state.gl.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), SECTION + 0.03)]
      }}
    >
      <Content nonce={nonce} />
    </Canvas>
  )
}
