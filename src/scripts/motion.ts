// Client-side motion engine. Ported from public/site.js (Averin template).
// Same math and timings as the original; only RTL needs are changed.
// Respects prefers-reduced-motion.

const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) =>
  Array.from(c.querySelectorAll<T>(s));

export function init(): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  hideBrokenImages();
  splitWords();
  const fill = setupFill(reduce);
  setupReveal(reduce);
  setupHero();
  setupScroll(reduce, fill);
  setupHeaderMenus();
  setupSteps();
}

// A1. Missing photo: hide the broken icon and keep the soft placeholder.
function hideBrokenImages(): void {
  $$<HTMLImageElement>("img").forEach((img) => {
    const miss = () => img.classList.add("x");
    if (img.complete && img.getAttribute("src") && !img.naturalWidth) miss();
    img.addEventListener("error", miss);
  });
}

// A8/A9. Split headings into words. We split on spaces only, so Arabic letters stay connected.
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

// A14. Words of a paragraph light up while it scrolls through.
function setupFill(reduce: boolean): { el: HTMLElement; words: HTMLElement[] } | null {
  const el = $("[data-fill]");
  if (!el) return null;
  el.innerHTML = (el.textContent ?? "")
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="fw">${w}</span>`)
    .join(" ");
  const words = $$(".fw", el);
  if (reduce) words.forEach((w) => w.classList.add("lit"));
  return { el, words };
}

// A7/A8/A15. Reveal on scroll, and count-up numbers once.
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
  // (A fully clipped box never counts as visible, so .clip boxes open with their parent card.)
  $$(".rv, [data-split]:not([data-split='blur'])").forEach((el) => io.observe(el));
  // Counters that are not inside a .rv box are observed on their own.
  $$("[data-count]").forEach((el) => {
    if (!el.closest(".rv")) io.observe(el);
  });
}

// A9/A10. Hero: photo opens, headline fades in word by word on load.
function setupHero(): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      $$("[data-hero], [data-split='blur']").forEach((el) => el.classList.add("in"));
    }),
  );
}

// A2, A12, A13, A14. Scroll-driven: header, parallax, drift, fill words.
function setupScroll(reduce: boolean, fill: { el: HTMLElement; words: HTMLElement[] } | null): void {
  const hdr = $(".hdr");
  const drift = $$("[data-drift]");
  const par = $$<HTMLElement>("[data-par]");
  // In RTL the drift direction is mirrored so the motion feels natural.
  const dir = document.dir === "rtl" || document.documentElement.dir === "rtl" ? -1 : 1;
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    if (hdr) {
      hdr.classList.toggle("solid", y > 8);
      if (!headerLocked() && Math.abs(y - lastY) > 4) {
        hdr.classList.toggle("hide", y > lastY && y > 320);
        lastY = y;
      }
    }
    if (!reduce) {
      drift.forEach((el) => {
        const parent = el.parentElement;
        if (!parent) return;
        const r = parent.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        el.style.transform = `translate3d(${(p - 0.5) * 2 * 7 * Number(el.dataset.drift) * dir}vw,0,0)`;
      });
      par.forEach((img) => {
        const parent = img.parentElement;
        if (!parent) return;
        const r = parent.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const off = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform = `translate3d(0,${off * -100 * Number(img.dataset.par)}%,0)`;
      });
      if (fill) {
        const fr = fill.el.getBoundingClientRect();
        const fp = Math.max(0, Math.min(1, (vh * 0.85 - fr.top) / (fr.height + vh * 0.3)));
        const lit = Math.round(fp * fill.words.length);
        fill.words.forEach((w, k) => w.classList.toggle("lit", k < lit));
      }
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
  window.addEventListener("resize", onScroll);
  onScroll();
}

// The header must stay visible while a menu is open.
function headerLocked(): boolean {
  return !!$(".hdr.open");
}

// A3, A6. Mega menu under "الخدمات" and the phone/tablet menu.
function setupHeaderMenus(): void {
  const hdr = $(".hdr");
  if (!hdr) return;

  // Mega menu
  const megaBtn = $("[data-mega]");
  const mega = $("#mega");
  let megaOpen = false;
  let menuOpen = false;
  let closeT: number | undefined;

  const setMega = (open: boolean) => {
    if (!megaBtn || !mega) return;
    megaOpen = open;
    megaBtn.setAttribute("aria-expanded", String(open));
    mega.classList.toggle("open", open);
    hdr.classList.toggle("open", open || menuOpen);
    if (open) hdr.classList.remove("hide");
  };

  if (megaBtn && mega) {
    megaBtn.addEventListener("click", () => setMega(!megaOpen));
    if (window.matchMedia("(hover: hover)").matches) {
      megaBtn.addEventListener("mouseenter", () => {
        window.clearTimeout(closeT);
        setMega(true);
      });
      [megaBtn, mega].forEach((el) => {
        el.addEventListener("mouseleave", () => {
          closeT = window.setTimeout(() => setMega(false), 220);
        });
        el.addEventListener("mouseenter", () => window.clearTimeout(closeT));
      });
    }
    $$("a", mega).forEach((a) => a.addEventListener("click", () => setMega(false)));
    document.addEventListener("click", (e) => {
      if (megaOpen && !hdr.contains(e.target as Node)) setMega(false);
    });
  }

  // Phone and tablet menu
  const menuBtn = $("[data-menu]");
  const menu = $("#menu");
  const setMenu = (open: boolean) => {
    if (!menuBtn || !menu) return;
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
    hdr.classList.toggle("open", open || megaOpen);
    hdr.classList.remove("hide");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) $("a", menu)?.focus({ preventScroll: true });
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => setMenu(!menuOpen));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    window.addEventListener("resize", () => {
      if (menuOpen && window.innerWidth > 1023) setMenu(false);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (megaOpen) {
      setMega(false);
      megaBtn?.focus();
    }
    if (menuOpen) {
      setMenu(false);
      menuBtn?.focus();
    }
  });
}

// A17. Sticky steps: the step in the middle of the screen drives the photo and the counter.
function setupSteps(): void {
  $$("[data-steps]").forEach((root) => {
    const steps = $$("[data-step]", root);
    const shots = $$("[data-shot]", root);
    const vnum = $("[data-vnum]", root);
    if (!steps.length) return;
    const sio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const k = Number((e.target as HTMLElement).dataset.step);
          steps.forEach((s) => s.classList.toggle("on", Number(s.dataset.step) === k));
          shots.forEach((s) => s.classList.toggle("on", Number(s.dataset.shot) === k));
          if (vnum) vnum.textContent = "0" + (k + 1);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    steps.forEach((s) => sio.observe(s));
  });
}

init();
