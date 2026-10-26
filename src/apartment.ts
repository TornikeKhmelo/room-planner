import type { ApartmentState, Item, Opening, PlannerState, Room, WallId } from './types'

// THE APARTMENT: flat #61, 7th floor, Dzotsi St 2, Tbilisi (90.2 m² + 13.7 m² balcony).
// Measured from the designer's electrical plan "#61 MEP _ 0. Ground Floor" (Liza Khavtasi, 13.02.2026):
// at 300 dpi the drawing is ~1 px per cm, checked against the room areas printed on it (the living
// room comes out at 40.2 m² vs 40.17 m² printed). Each room is modelled as a rectangle; the hall and
// the bedroom's entry nook are simplified. Ceiling height is not on the plan: 280 cm is an estimate.
//
// Coordinates per room: cm, origin at the room's north-west inside corner ("north" = top of the plan),
// x west→east, z north→south. Wall `along` positions: north from west, east from north, south from
// east, west from south (left end of the wall as seen from inside the room).

export const CURRENT_VARIANT_ID = 'current'
const H = 280
const WHITE = '#f1eee8'

type Ctx = { W: number; D: number }
/** Converts a plan position along a wall into that wall's `along` coordinate. */
const along = ({ W, D }: Ctx, wall: WallId, v: number) => (wall === 'north' || wall === 'east' ? v : wall === 'south' ? W - v : D - v)

function opening(c: Ctx, id: string, wall: WallId, kind: 'window' | 'door', from: number, to: number, extra: Partial<Opening> = {}): Opening {
  const a = along(c, wall, (from + to) / 2)
  const door = kind === 'door'
  return { id, wall, kind, along: Math.round(a), width: Math.round(to - from), height: door ? 210 : 150, sill: door ? 0 : 85, ...extra }
}

function room(name: string, W: number, D: number, rest: Partial<Room>): Room {
  return { name, width: W, depth: D, height: H, wallThickness: 12, wallColor: WHITE, floorColor: '#c99254', floorKind: 'oak', finishes: [], openings: [], ...rest }
}

const floor = (x: number, z: number, rot = 0) => ({ type: 'floor' as const, x, z, rot })
const onWall = (wall: WallId, a: number, elev: number) => ({ type: 'wall' as const, wall, along: a, elev })
const fixed = { fixture: true, locked: true }

function tallRadiator(id: string, wall: WallId, a: number): Item {
  return { id, name: 'Radiator (tall)', shape: 'radiator', size: { w: 45, d: 10, h: 180 }, color: '#ececec', ...fixed, place: onWall(wall, a, 12) }
}
function radiator(id: string, wall: WallId, a: number, w = 80): Item {
  return { id, name: 'Radiator', shape: 'radiator', size: { w, d: 10, h: 55 }, color: '#f1f1f1', ...fixed, place: onWall(wall, a, 12) }
}

// ------------------------------------------------------------------ living room + kitchen

function living(): PlannerState {
  const c = { W: 670, D: 565 }
  const r = room('Living room & kitchen', c.W, c.D, {
    floorColor: '#c99254',
    wallNames: { north: 'kitchen wall', east: 'TV wall', south: 'balcony wall', west: 'window wall' },
    openings: [
      opening(c, 'to-hall', 'north', 'door', 2, 300, { open: true, height: 240, label: 'Open to the hall' }),
      opening(c, 'win-w1', 'west', 'window', 10, 160, { sill: 40, height: 210, label: 'Window' }),
      opening(c, 'win-w2', 'west', 'window', 230, 450, { sill: 40, height: 210, label: 'Window' }),
      opening(c, 'win-s1', 'south', 'window', 10, 180, { sill: 40, height: 210, label: 'Window' }),
      opening(c, 'bal-1', 'south', 'door', 195, 295, { height: 230, label: 'Balcony door' }),
      opening(c, 'bal-2', 'south', 'door', 410, 505, { height: 230, label: 'Balcony door' }),
      opening(c, 'win-s2', 'south', 'window', 515, 640, { sill: 40, height: 210, label: 'Window' }),
    ],
  })
  const kitchen = { color: '#e9e6df', color2: '#cfc9bf', finish: 'painted' as const, worktop: 'stone' as const }
  const items: Item[] = [
    { id: 'k-tall', name: 'Fridge column', shape: 'kitchenTall', style: 'fridge', size: { w: 62, d: 62, h: 225 }, ...kitchen, ...fixed, place: floor(337, 31, 0) },
    { id: 'k-run', name: 'Kitchen run (sink)', shape: 'kitchenBase', style: 'sink', size: { w: 300, d: 62, h: 90 }, ...kitchen, ...fixed, place: floor(518, 31, 0) },
    { id: 'k-side', name: 'Kitchen run (hob)', shape: 'kitchenBase', style: 'hob', size: { w: 150, d: 62, h: 90 }, ...kitchen, ...fixed, place: floor(639, 137, 90) },
    { id: 'k-wall', name: 'Wall cabinets', shape: 'kitchenWall', size: { w: 240, d: 35, h: 72 }, ...kitchen, ...fixed, place: onWall('north', 488, 150) },
    { id: 'island', name: 'Kitchen island', shape: 'island', size: { w: 195, d: 100, h: 90 }, ...kitchen, place: floor(402, 200, 0) },
    ...[327, 372, 417, 462].map((x, i): Item => ({ id: `stool-${i}`, name: 'Bar stool', shape: 'barStool', size: { w: 40, d: 40, h: 75 }, color: '#2b2b2b', color2: '#b08d6a', place: floor(x, 280, 180) })),
    { id: 'dining', name: 'Dining table', shape: 'table', size: { w: 220, d: 95, h: 75 }, color: '#b98b5e', color2: '#2a2a2a', place: floor(187, 395, 90) },
    ...[330, 445].flatMap((z, i): Item[] => [
      { id: `chair-l${i}`, name: 'Dining chair', shape: 'chair', size: { w: 46, d: 52, h: 82 }, color: '#d8d2c4', color2: '#2a2a2a', place: floor(112, z, 270) },
      { id: `chair-r${i}`, name: 'Dining chair', shape: 'chair', size: { w: 46, d: 52, h: 82 }, color: '#d8d2c4', color2: '#2a2a2a', place: floor(262, z, 90) },
    ]),
    { id: 'sofa', name: 'Sofa', shape: 'sofa', size: { w: 220, d: 92, h: 82 }, color: '#8a8d90', finish: 'fabric', place: floor(392, 420, 270) },
    { id: 'coffee', name: 'Coffee table', shape: 'table', style: 'round-pedestal', size: { w: 70, d: 70, h: 40 }, color: '#b98b5e', place: floor(520, 420, 0) },
    { id: 'tv-unit', name: 'TV unit', shape: 'box', style: 'drawers', finish: 'wood', size: { w: 180, d: 40, h: 45 }, color: '#b98b5e', place: floor(650, 420, 90) },
    { id: 'tv', name: 'TV 65"', shape: 'poster', size: { w: 145, d: 4, h: 83 }, color: '#111111', frame: 0, place: onWall('east', 420, 95) },
    { id: 'rug', name: 'Rug', shape: 'rug', size: { w: 200, d: 290, h: 1 }, color: '#cbbfae', place: floor(470, 420, 0) },
    tallRadiator('rad-w', 'west', along(c, 'west', 510)),
    tallRadiator('rad-s', 'south', along(c, 'south', 352)),
    tallRadiator('rad-e', 'east', 540),
  ]
  return state(r, items)
}

// ------------------------------------------------------------------ bedroom

function bedroom(): PlannerState {
  const c = { W: 485, D: 293 }
  const r = room('Bedroom', c.W, c.D, {
    wallNames: { north: 'bed wall', east: 'wardrobe wall', south: 'door wall', west: 'window wall' },
    openings: [
      opening(c, 'win', 'west', 'window', 50, 230, { label: 'Window' }),
      opening(c, 'door', 'south', 'door', 385, 475, { label: 'Door to the hall' }),
      opening(c, 'to-wardrobe', 'east', 'door', 115, 205, { open: true, label: 'Into the wardrobe' }),
    ],
  })
  const items: Item[] = [
    { id: 'bed', name: 'Bed 160×200', shape: 'bed', style: 'cushioned', finish: 'fabric', size: { w: 175, d: 215, h: 100 }, color: '#9a958d', color2: '#eeeae3', place: floor(279, 110, 0) },
    { id: 'ns-l', name: 'Bedside table', shape: 'box', style: 'drawers', finish: 'wood', size: { w: 45, d: 40, h: 50 }, color: '#b98b5e', place: floor(164, 22, 0) },
    { id: 'ns-r', name: 'Bedside table', shape: 'box', style: 'drawers', finish: 'wood', size: { w: 45, d: 40, h: 50 }, color: '#b98b5e', place: floor(394, 22, 0) },
    { id: 'desk', name: 'Desk', shape: 'desk', style: 'classic', size: { w: 100, d: 55, h: 75 }, color: '#e8e4dc', color2: '#2a2a2a', place: floor(29, 225, 270) },
    { id: 'desk-chair', name: 'Desk chair', shape: 'officeChair', style: 'mesh', size: { w: 62, d: 62, h: 115 }, color: '#2b2b2b', color2: '#3a3a3a', place: floor(88, 225, 90) },
    { id: 'curtain', name: 'Curtain', shape: 'curtain', style: 'semi', size: { w: 230, d: 12, h: H - 6 }, color: '#e9e3d6', place: onWall('west', along(c, 'west', 140), 0) },
    radiator('rad', 'south', along(c, 'south', 97)),
  ]
  return state(r, items)
}

// ------------------------------------------------------------------ second room

function study(): PlannerState {
  const c = { W: 340, D: 373 }
  const r = room('Second room', c.W, c.D, {
    wallNames: { north: 'sofa wall', east: 'door wall', south: 'desk wall', west: 'window wall' },
    openings: [opening(c, 'win', 'west', 'window', 118, 363, { label: 'Window' }), opening(c, 'door', 'east', 'door', 28, 118, { label: 'Door to the hall' })],
  })
  const items: Item[] = [
    { id: 'sofa', name: 'Sofa', shape: 'sofa', size: { w: 170, d: 88, h: 80 }, color: '#7b8794', finish: 'fabric', place: floor(205, 46, 0) },
    { id: 'armchair', name: 'Armchair', shape: 'sofa', style: 'barrel', size: { w: 78, d: 78, h: 75 }, color: '#c9b79c', finish: 'boucle', place: floor(48, 170, 270) },
    { id: 'coffee', name: 'Coffee table', shape: 'table', size: { w: 110, d: 55, h: 40 }, color: '#b98b5e', color2: '#2a2a2a', place: floor(205, 168, 0) },
    { id: 'desk', name: 'Desk', shape: 'desk', style: 'metal', size: { w: 160, d: 60, h: 74 }, color: '#e8e4dc', color2: '#2a2a2a', place: floor(220, 343, 180) },
    { id: 'desk-chair', name: 'Desk chair', shape: 'officeChair', style: 'mesh', size: { w: 62, d: 62, h: 115 }, color: '#2b2b2b', color2: '#3a3a3a', place: floor(220, 275, 0) },
    { id: 'curtain', name: 'Curtain', shape: 'curtain', style: 'semi', size: { w: 260, d: 12, h: H - 6 }, color: '#e9e3d6', place: onWall('west', along(c, 'west', 240), 0) },
    radiator('rad', 'south', along(c, 'south', 58)),
  ]
  return state(r, items)
}

// ------------------------------------------------------------------ walk-in wardrobe

function wardrobe(): PlannerState {
  const c = { W: 135, D: 293 }
  const r = room('Wardrobe', c.W, c.D, {
    openings: [opening(c, 'from-bedroom', 'west', 'door', 115, 205, { open: true, label: 'From the bedroom' })],
  })
  const unit = (id: string, w: number, x: number, z: number, rot: number): Item => ({
    id, name: 'Wardrobe', shape: 'box', style: 'doors', finish: 'painted', size: { w, d: 58, h: 240 }, color: '#efede8', place: floor(x, z, rot),
  })
  return state(r, [unit('w-north', 135, 67, 29, 0), unit('w-east', 100, 106, 160, 90), unit('w-south', 135, 67, 264, 180)])
}

// ------------------------------------------------------------------ hall

function hall(): PlannerState {
  const c = { W: 300, D: 535 }
  const r = room('Hall', c.W, c.D, {
    floorKind: 'bigTile',
    floorColor: '#d9d4cb',
    openings: [
      opening(c, 'to-bedroom', 'north', 'door', 45, 135, { label: 'Bedroom' }),
      opening(c, 'to-study', 'west', 'door', 40, 130, { label: 'Second room' }),
      opening(c, 'entrance', 'east', 'door', 20, 115, { label: 'Front door' }),
      opening(c, 'to-bath', 'east', 'door', 205, 285, { label: 'Bathroom' }),
      opening(c, 'to-wc', 'east', 'door', 365, 445, { label: 'WC' }),
      opening(c, 'to-living', 'south', 'door', 2, 298, { open: true, height: 240, label: 'Open to the living room' }),
    ],
  })
  const items: Item[] = [
    { id: 'closet', name: 'Hall wardrobe', shape: 'box', style: 'doors', finish: 'painted', size: { w: 110, d: 60, h: 240 }, color: '#efede8', place: floor(30, 350, 270) },
    { id: 'mirror', name: 'Mirror', shape: 'mirror', size: { w: 60, d: 3, h: 160 }, color: '#2a2a2a', place: onWall('east', 160, 40) },
  ]
  return state(r, items)
}

// ------------------------------------------------------------------ bathrooms

const BATH_TILES = { height: 220, color: '#e6e2db', grout: '#cfcac1', pattern: 'big' as const }

function bathroom(): PlannerState {
  const c = { W: 315, D: 130 }
  const r = room('Bathroom', c.W, c.D, {
    floorKind: 'tile',
    floorColor: '#bdb6ab',
    tiles: { walls: ['north', 'east', 'south', 'west'], ...BATH_TILES },
    openings: [opening(c, 'door', 'west', 'door', 25, 105, { label: 'Door to the hall' })],
  })
  const items: Item[] = [
    { id: 'basin', name: 'Washbasin', shape: 'basin', size: { w: 70, d: 46, h: 85 }, color: '#f4f2ee', color2: '#b98b5e', ...fixed, place: floor(85, 23, 0) },
    { id: 'toilet', name: 'Toilet', shape: 'toilet', size: { w: 38, d: 55, h: 40 }, color: '#f7f6f3', ...fixed, place: floor(168, 28, 0) },
    { id: 'tub', name: 'Bath', shape: 'bathtub', size: { w: 105, d: 130, h: 58 }, color: '#f7f6f3', ...fixed, place: floor(262, 65, 0) },
    { id: 'mirror', name: 'Mirror', shape: 'mirror', size: { w: 60, d: 3, h: 80 }, color: '#2a2a2a', place: onWall('north', 85, 105) },
  ]
  return state(r, items)
}

function wc(): PlannerState {
  const c = { W: 250, D: 145 }
  const r = room('WC', c.W, c.D, {
    floorKind: 'tile',
    floorColor: '#bdb6ab',
    tiles: { walls: ['north', 'east', 'south', 'west'], ...BATH_TILES },
    openings: [opening(c, 'door', 'west', 'door', 40, 120, { label: 'Door to the hall' })],
  })
  const items: Item[] = [
    { id: 'basin', name: 'Washbasin', shape: 'basin', size: { w: 55, d: 40, h: 85 }, color: '#f4f2ee', color2: '#b98b5e', ...fixed, place: floor(57, 20, 0) },
    { id: 'toilet', name: 'Toilet', shape: 'toilet', size: { w: 38, d: 55, h: 40 }, color: '#f7f6f3', ...fixed, place: floor(142, 28, 0) },
    { id: 'washer', name: 'Washing machine', shape: 'washer', size: { w: 60, d: 58, h: 85 }, color: '#f2f2f2', place: floor(215, 30, 0) },
    { id: 'mirror', name: 'Mirror', shape: 'mirror', style: 'wall-round', size: { w: 50, d: 3, h: 50 }, color: '#2a2a2a', place: onWall('north', 57, 110) },
  ]
  return state(r, items)
}

// ------------------------------------------------------------------ balcony

function balcony(): PlannerState {
  const c = { W: 600, D: 230 }
  const r = room('Balcony', c.W, c.D, {
    height: 260,
    floorKind: 'bigTile',
    floorColor: '#a9a39a',
    wallColor: '#e7e3dc',
    openings: [
      opening(c, 'win-n1', 'north', 'window', 10, 180, { sill: 40, height: 210 }),
      opening(c, 'bal-1', 'north', 'door', 195, 295, { height: 230, label: 'To the living room' }),
      opening(c, 'bal-2', 'north', 'door', 410, 505, { height: 230, label: 'To the living room' }),
      opening(c, 'open-s', 'south', 'window', 20, 580, { sill: 100, height: 150, label: 'Railing' }),
      opening(c, 'open-w', 'west', 'window', 20, 210, { sill: 100, height: 150, label: 'Railing' }),
    ],
  })
  const items: Item[] = [
    { id: 'table', name: 'Bistro table', shape: 'table', style: 'round-pedestal', size: { w: 70, d: 70, h: 74 }, color: '#2b2b2b', place: floor(120, 150, 0) },
    { id: 'chair-1', name: 'Chair', shape: 'chair', size: { w: 46, d: 52, h: 82 }, color: '#2b2b2b', color2: '#2b2b2b', place: floor(52, 150, 90) },
    { id: 'chair-2', name: 'Chair', shape: 'chair', size: { w: 46, d: 52, h: 82 }, color: '#2b2b2b', color2: '#2b2b2b', place: floor(188, 150, 270) },
    { id: 'plant', name: 'Plant', shape: 'plant', style: 'palm', size: { w: 60, d: 60, h: 150 }, color: '#4f7d4a', color2: '#c06a45', place: floor(560, 190, 0) },
  ]
  return state(r, items)
}

// ------------------------------------------------------------------

function state(room: Room, items: Item[]): PlannerState {
  return { version: 1, room, variants: [{ id: CURRENT_VARIANT_ID, name: 'Current room', items }], activeVariantId: CURRENT_VARIANT_ID }
}

/**
 * Rooms in the order the switcher lists them. `origin` is the room's north-west inside corner on the
 * plan (cm, same axes as inside a room), used to put the rooms together in the whole-flat view.
 */
export const ROOMS: { id: string; label: string; area: string; origin: [number, number]; make: () => PlannerState }[] = [
  { id: 'living', label: 'Living room & kitchen', area: '40.2 m²', origin: [1700, 1135], make: living },
  { id: 'bedroom', label: 'Bedroom', area: '13.0 m²', origin: [1360, 305], make: bedroom },
  { id: 'study', label: 'Second room', area: '13.8 m²', origin: [1360, 612], make: study },
  { id: 'wardrobe', label: 'Wardrobe', area: '4.2 m²', origin: [1855, 305], make: wardrobe },
  { id: 'hall', label: 'Hall', area: '8.1 m²', origin: [1700, 600], make: hall },
  { id: 'bathroom', label: 'Bathroom', area: '4.4 m²', origin: [2015, 775], make: bathroom },
  { id: 'wc', label: 'WC', area: '4.0 m²', origin: [2015, 920], make: wc },
  { id: 'balcony', label: 'Balcony', area: '13.7 m²', origin: [1700, 1715], make: balcony },
]

export function defaultRoomState(id: string): PlannerState {
  const def = ROOMS.find((r) => r.id === id) ?? ROOMS[0]
  return structuredClone(def.make())
}

export function defaultApartment(): ApartmentState {
  return { version: 2, activeRoomId: ROOMS[0].id, rooms: Object.fromEntries(ROOMS.map((r) => [r.id, defaultRoomState(r.id)])) }
}
