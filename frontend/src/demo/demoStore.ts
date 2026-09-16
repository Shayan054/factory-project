import { createSeedStore, type DemoStore } from "./demoData";

export const GUEST_MODE_KEY = "guest_mode";
export const DEMO_STORE_KEY = "demo_store";
export const DRAFT_ORDER_KEY = "draft_order";

export function isGuestMode(): boolean {
  return sessionStorage.getItem(GUEST_MODE_KEY) === "1";
}

export function setGuestModeFlag(on: boolean) {
  if (on) sessionStorage.setItem(GUEST_MODE_KEY, "1");
  else sessionStorage.removeItem(GUEST_MODE_KEY);
}

export function clearGuestSessionStorage() {
  sessionStorage.removeItem(GUEST_MODE_KEY);
  sessionStorage.removeItem(DEMO_STORE_KEY);
  sessionStorage.removeItem(DRAFT_ORDER_KEY);
}

/** Always reseeds — fresh demo data whenever Demo Mode starts. */
export function startFreshDemoStore(): DemoStore {
  const store = createSeedStore();
  saveDemoStore(store);
  return store;
}

export function loadDemoStore(): DemoStore {
  const raw = sessionStorage.getItem(DEMO_STORE_KEY);
  if (!raw) {
    return startFreshDemoStore();
  }
  try {
    return JSON.parse(raw) as DemoStore;
  } catch {
    return startFreshDemoStore();
  }
}

export function saveDemoStore(store: DemoStore) {
  sessionStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
}

export function nextId(store: DemoStore, key: keyof DemoStore["nextIds"]): number {
  const id = store.nextIds[key] ?? 1;
  store.nextIds[key] = id + 1;
  return id;
}
