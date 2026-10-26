// All lengths are centimetres. Plan coordinates: x runs west→east, z runs north→south,
// origin is the north-west inside corner of the room.

export type WallId = 'north' | 'east' | 'south' | 'west'

export type FloorShape =
  | 'bed'
  | 'desk'
  | 'officeChair'
  | 'chair'
  | 'sofa'
  | 'bookshelf'
  | 'floorLamp'
  | 'tripod'
  | 'lightStand'
  | 'foldingChair'
  | 'table'
  | 'box'
  | 'rug'
  | 'plant'
  // Kitchen and bathroom pieces (fixed in place by default).
  | 'kitchenBase'
  | 'kitchenTall'
  | 'island'
  | 'barStool'
  | 'bathtub'
  | 'shower'
  | 'toilet'
  | 'basin'
  | 'washer'
  /** A product photo with its background removed, standing at real size. */
  | 'cutout'

export type WallShape = 'poster' | 'ac' | 'whiteboard' | 'curtain' | 'radiator' | 'wallShelf' | 'mirror' | 'kitchenWall'

export type Shape = FloorShape | WallShape

/** w = width (left-right), d = depth (front-back, or how far it sticks out of a wall), h = height. */
export interface Size {
  w: number
  d: number
  h: number
}

/** Floor items: centre point plus rotation in degrees, clockwise seen from above. At rot 0 the front faces south. */
export interface FloorPlacement {
  type: 'floor'
  x: number
  z: number
  rot: number
}

/**
 * Wall items: `along` is the item's centre measured from the wall's left end as seen standing
 * inside the room facing that wall; `elev` is the height of its bottom edge above the floor.
 */
export interface WallPlacement {
  type: 'wall'
  wall: WallId
  along: number
  elev: number
}

export type Placement = FloorPlacement | WallPlacement

export interface Item {
  id: string
  name: string
  shape: Shape
  size: Size
  color: string
  /** Secondary colour: bed sheets, chair base, plant pot, light-stand panel… */
  color2?: string
  /** Look variant within a shape, e.g. office chair 'mesh' or 'executive', lamp 'arc'. */
  style?: string
  /** Main surface material, e.g. 'fabric', 'velvet', 'leather', 'wood', 'metal'. */
  finish?: Finish
  place: Placement
  /** Picture used as poster art, product photo on a box, or rug pattern. */
  image?: string
  /** Frame border in cm drawn around poster art; 0 when the image already includes the frame. */
  frame?: number
  /** Optional .glb model, scaled to `size`. */
  model?: string
  link?: string
  price?: string
  notes?: string
  /** Part of the building (radiator, AC…). Shown separately and locked by default. */
  fixture?: boolean
  locked?: boolean
  hidden?: boolean
  /** Catalog entry this item was placed from. */
  catalogId?: string
  /** Shop product photo, for the details card. */
  photo?: string
  store?: string
  category?: Category
  /** Kitchen pieces: worktop material (the worktop colour is `color2`). */
  worktop?: WorktopKind
}

export type WorktopKind = 'wood' | 'stone' | 'concrete' | 'laminate'

export type FloorKind = 'oak' | 'chevron' | 'plank' | 'tile' | 'bigTile' | 'microcement'

/** Wall tiles from the floor up to `height` on the listed walls (bathrooms). */
export interface WallTiles {
  walls: WallId[]
  height: number
  color: string
  grout: string
  /** 'metro' 30×10, 'square' 20×20, 'big' 60×120 cm. */
  pattern: 'metro' | 'square' | 'big'
}

export interface Opening {
  id: string
  wall: WallId
  kind: 'window' | 'door'
  /** Centre, measured like WallPlacement.along. */
  along: number
  width: number
  height: number
  /** Bottom edge above the floor (0 for doors). */
  sill: number
  label?: string
  /** A doorway with no door leaf (an open passage between rooms). */
  open?: boolean
}

/** A stretch of wall with a different finish, e.g. the brown panelling behind the bed and desk. */
export interface WallFinish {
  wall: WallId
  from: number
  to: number
  color: string
}

export interface Room {
  name: string
  width: number
  depth: number
  height: number
  wallThickness: number
  wallColor: string
  floorColor: string
  /** Floor material; oak strip parquet when unset. */
  floorKind?: FloorKind
  /** Paint colour per wall, overriding `wallColor`. */
  wallColors?: Partial<Record<WallId, string>>
  tiles?: WallTiles
  finishes: WallFinish[]
  openings: Opening[]
  /** Friendly names for the walls, used in layout suggestions ("Bed on the poster wall"). */
  wallNames?: Partial<Record<WallId, string>>
}

export interface Variant {
  id: string
  name: string
  items: Item[]
  /** 'layout' when it was opened from a layout suggestion; trying another layout reuses it. */
  source?: 'layout'
}

export interface PlannerState {
  version: 1
  room: Room
  variants: Variant[]
  activeVariantId: string
}

/** The whole flat: one PlannerState per room, edited one room at a time. */
export interface ApartmentState {
  version: 2
  activeRoomId: string
  rooms: Record<string, PlannerState>
}

export type Finish = 'fabric' | 'velvet' | 'boucle' | 'leather' | 'wood' | 'painted' | 'metal'

/** Shop categories, in the order the shop shows them. */
export type Category =
  | 'bed'
  | 'sofa'
  | 'armchair'
  | 'desk'
  | 'officeChair'
  | 'bookshelf'
  | 'floorLamp'
  | 'rug'
  | 'curtain'
  | 'wallArt'
  | 'mirror'
  | 'plant'
  | 'nightstand'
  | 'dresser'
  | 'wardrobe'
  | 'sideTable'
  | 'wallShelf'

/** Something to try in the room: a real product from a shop (data/shop.json) or one of your finds (data/catalog.json). */
export interface CatalogEntry {
  id: string
  name: string
  shape: Shape
  size: Size
  color: string
  color2?: string
  style?: string
  finish?: Finish
  /** Texture used in 3D: poster art, rug pattern, cut-out photo. */
  image?: string
  /** Product photo shown in the shop, and any extra photos. */
  photo?: string
  photos?: string[]
  frame?: number
  model?: string
  link?: string
  price?: string
  oldPrice?: string
  store?: string
  category?: Category
  colorName?: string
  notes?: string
  worktop?: WorktopKind
}
