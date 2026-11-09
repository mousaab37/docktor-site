// Client-side motion: reveals, word split, count-up, header behavior, mobile menu.
// Ported from public/site.js (Averin template). Respects prefers-reduced-motion.

const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

export function init(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  hideBrokenImages();
  splitWords();
  setupReveal(reduce);
  setupHero();
  setupHeaderAndMenu();
}

// Missing photo: hide the broken icon and keep the soft placeholder.
function hideBrokenImages(): void {
  $$<HTMLImageElement>("img").forEach((img) => {
    const miss = () => img.classList.add("x");
    if (img.complete && img.getAttribute("src") && !img.naturalWidth) miss();
    img.addEventListener("error", miss);
  });
}

// Split headings into words. We split on spaces only, so Arabic letters stay connected.
function splitWords(): void {
  $$("[data-split]").forEach((el) => {
    let i = 0;
    const walk = (node: Node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          (child.textContent ?? "").split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const w = document.createElement("span");
            const wi = document.createElement("span");
            w.className = "w";
            wi.className = "wi";
            wi.style.setProperty("--i", String(i++));
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    };
    walk(el);
  });
}

// Reveal on scroll, and count-up numbers once.
function setupReveal(reduce: boolean): void {
  const countUp = (scope: HTMLElement) => {
    const nodes = scope.matches("[data-count]") ? [scope] : $$("[data-count]", scope);
    nodes.forEach((n) => {
      const to = Number(n.dataset.count);
      if (reduce || !to) return;
      let t0: number | null = null;
      const step = (t: number) => {
        if (t0 === null) t0 = t;
        const p = Math.min((t - t0) / 1400, 1);
        // Western digits on purpose: the database stores them this way.
        n.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add("in");
        io.unobserve(el);
        countUp(el);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  $$(".rv, [data-split]:not([data-split='blur'])").forEach((el) => io.observe(el));
  // Counters that are not inside a .rv box are observed on their own.
  $$("[data-count]").forEach((el) => {
    if (!el.closest(".rv")) io.observe(el);
  });
}

// Hero: headline fades in word by word on load.
function setupHero(): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      $$("[data-hero], [data-split='blur']").forEach((el) => el.classList.add("in"));
    }),
  );
}

function setupHeaderAndMenu(): void {
  const hdr = $(".hdr");
  const menuBtn = $("[data-menu]");
  const menu = $("#menu");
  if (!hdr) return;

  let lastY = window.scrollY;
  let menuOpen = false;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    hdr.classList.toggle("solid", y > 8);
    if (!menuOpen && Math.abs(y - lastY) > 4) {
      hdr.classList.toggle("hide", y > lastY && y > 320);
      lastY = y;
    }
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  if (!menuBtn || !menu) return;

  const setMenu = (open: boolean) => {
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
    hdr.classList.toggle("open", open);
    hdr.classList.remove("hide");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("a", menu)?.focus({ preventScroll: true });
  };

  menuBtn.addEventListener("click", () => setMenu(!menuOpen));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("resize", () => {
    if (menuOpen && window.innerWidth > 1023) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenu(false);
      menuBtn.focus();
    }
  });
}

init();
