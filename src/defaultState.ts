import { CURRENT_VARIANT_ID, defaultRoomState, ROOMS } from './apartment'
import type { PlannerState, Room } from './types'

// The rooms themselves live in src/apartment.ts (one per room of the flat). This module keeps the
// names the rest of the app imports.

export { CURRENT_VARIANT_ID }

/** The first room, used as a base for the ?showroom view. */
export const defaultRoom: Room = defaultRoomState(ROOMS[0].id).room

/** The default model of one room (the living room when no id is given). */
export function defaultState(roomId: string = ROOMS[0].id): PlannerState {
  return defaultRoomState(roomId)
}
