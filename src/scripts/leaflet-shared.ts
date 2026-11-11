// Map code shared by the dashboard location picker and the per-clinic maps on the home page.
import type * as Leaflet from "leaflet";

type LeafletNS = typeof Leaflet;

let cached: Promise<LeafletNS> | null = null;
let loaded: LeafletNS | null = null;

/** Loads Leaflet and its CSS once per page. */
export function loadLeaflet(): Promise<LeafletNS> {
  cached ??= Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([mod]) => {
    loaded = mod.default;
    return mod.default;
  });
  return cached;
}

/** Leaflet after `loadLeaflet()` has resolved (the helpers below need it). */
function leaflet(): LeafletNS {
  if (!loaded) throw new Error("Call loadLeaflet() first");
  return loaded;
}

/** Lazy start: runs `cb` once, when `el` comes near the viewport. */
export function whenNear(el: Element, cb: () => void, margin = "300px 0px"): void {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb();
    },
    { rootMargin: margin },
  );
  io.observe(el);
}

/** Map options used everywhere: no wheel zoom; on phones one finger scrolls the page (see enableTwoFingerPan). */
export function baseMapOptions(): Leaflet.MapOptions & { tap?: boolean } {
  // `tap` is a real Leaflet 1.x option that @types/leaflet does not declare, so it is added to the type here.
  return { scrollWheelZoom: false, dragging: !leaflet().Browser.mobile, tap: false };
}

/** OpenStreetMap tiles with the required attribution. */
// TODO: choose the production tile provider (PRD open decision #4)
export function addOsmTiles(map: Leaflet.Map): void {
  leaflet()
    .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    })
    .addTo(map);
}

/**
 * Phones only: one finger scrolls the page, two fingers pan the map (task 7a), and the first
 * one-finger touch shows a short hint. Desktop is unchanged.
 */
export function enableTwoFingerPan(map: Leaflet.Map, el: HTMLElement): void {
  if (!leaflet().Browser.mobile) return;
  const hint = document.createElement("div");
  hint.className = "map-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = "استخدم إصبعين لتحريك الخريطة";
  el.appendChild(hint);
  let shown = false;
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length >= 2) {
        map.dragging.enable();
      } else if (!shown) {
        shown = true;
        hint.classList.add("show");
        window.setTimeout(() => hint.classList.remove("show"), 1500);
      }
    },
    { passive: true },
  );
  el.addEventListener("touchend", () => map.dragging.disable(), { passive: true });
  el.addEventListener("touchcancel", () => map.dragging.disable(), { passive: true });
}

/** The clinic marker: a forest dot with a white ring (no default marker images). */
export function clinicDotIcon(): Leaflet.DivIcon {
  return leaflet().divIcon({ className: "pick-dot", html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] });
}
