import bundledCatalog from '../data/catalog.json'
import { defaultApartment } from './apartment'
import { useStore } from './store'
import type { ApartmentState, CatalogEntry, PlannerState } from './types'

const LOCAL_KEY = 'room-planner-apartment'

/** Whether the dev server's file API is there (it isn't in a static build). */
let api = false

async function fetchJson(url: string): Promise<{ status: number; body: unknown } | null> {
  try {
    const res = await fetch(url)
    if (!res.headers.get('content-type')?.includes('application/json')) return null
    return { status: res.status, body: await res.json() }
  } catch {
    return null
  }
}

function isState(value: unknown): value is PlannerState {
  const v = value as PlannerState
  return !!v && v.version === 1 && !!v.room && Array.isArray(v.variants) && v.variants.length > 0
}

function isApartment(value: unknown): value is ApartmentState {
  const v = value as ApartmentState
  return !!v && v.version === 2 && !!v.rooms && Object.values(v.rooms).every(isState)
}

function readLocal(): ApartmentState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? 'null')
    return isApartment(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function loadCatalog() {
  const res = await fetchJson('/api/catalog')
  const list = res?.status === 200 && Array.isArray(res.body) ? res.body : bundledCatalog
  useStore.getState().setCatalog(list as CatalogEntry[])
}

export async function addToCatalog(entry: CatalogEntry) {
  if (!api) {
    useStore.getState().setCatalog([...useStore.getState().catalog.filter((e) => e.id !== entry.id), entry])
    return
  }
  const res = await fetch('/api/catalog', { method: 'POST', body: JSON.stringify(entry) })
  if (res.ok) useStore.getState().setCatalog(await res.json())
}

export async function removeFromCatalog(id: string) {
  if (!api) {
    useStore.getState().setCatalog(useStore.getState().catalog.filter((e) => e.id !== id))
    return
  }
  const res = await fetch(`/api/catalog/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (res.ok) useStore.getState().setCatalog(await res.json())
}

/** Saves an image into public/uploads when the dev server is running; otherwise keeps it inline. */
export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  if (!api) return dataUrl
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: JSON.stringify({ name: file.name, dataUrl }) })
    if (res.ok) return ((await res.json()) as { url: string }).url
  } catch {
    // fall through to the inline copy
  }
  return dataUrl
}

async function fetchState(): Promise<ApartmentState | null> {
  const res = await fetchJson('/api/state')
  api = !!res
  // An older single-room file (version 1) is ignored: the flat starts from the plan.
  return res?.status === 200 && isApartment(res.body) ? res.body : null
}

let timer: ReturnType<typeof setTimeout> | undefined

async function save() {
  const { apartment, setSaveStatus } = useStore.getState()
  const state = apartment()
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked; the file copy below still works
  }
  if (!api) return setSaveStatus('local')
  try {
    const res = await fetch('/api/state', { method: 'PUT', body: JSON.stringify(state) })
    setSaveStatus(res.ok ? 'saved' : 'error')
  } catch {
    setSaveStatus('error')
  }
}

export async function startPersistence() {
  const fromFile = await fetchState()
  const store = useStore.getState()
  store.hydrateApartment(fromFile ?? readLocal() ?? defaultApartment())
  store.setSaveStatus(api ? 'saved' : 'local')
  await loadCatalog()

  useStore.subscribe((s, prev) => {
    if (s.room === prev.room && s.variants === prev.variants && s.activeVariantId === prev.activeVariantId && s.activeRoomId === prev.activeRoomId) return
    if (!s.loaded) return
    clearTimeout(timer)
    if (api) s.setSaveStatus('saving')
    timer = setTimeout(save, 400)
  })

  // Claude (or you) edited data/*.json directly while the app was open: pick the changes up live.
  if (import.meta.hot) {
    import.meta.hot.on('room:state-changed', async () => {
      const next = await fetchState()
      if (!next) return
      useStore.getState().hydrateApartment(next)
    })
    import.meta.hot.on('room:catalog-changed', () => void loadCatalog())
  }
}
