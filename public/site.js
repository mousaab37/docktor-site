(function () {
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  // Missing photo: hide the broken icon and keep the soft placeholder.
  $$("img").forEach(function (img) {
    function miss() { img.classList.add("x"); }
    if (img.complete && img.getAttribute("src") && !img.naturalWidth) miss();
    img.addEventListener("error", miss);
  });

  // Split headings into words for the rise and blur reveals.
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement("span"), wi = document.createElement("span");
            w.className = "w"; wi.className = "wi"; wi.style.setProperty("--i", i++); wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) { walk(child); }
      });
    })(el);
  });

  // Words of the green statement light up as it scrolls through.
  var fill = $("[data-fill]"), fillWords = [];
  if (fill) {
    fill.innerHTML = fill.textContent.trim().split(/\s+/).map(function (w) { return '<span class="fw">' + w + "</span>"; }).join(" ");
    fillWords = $$(".fw", fill);
    if (reduce) fillWords.forEach(function (w) { w.classList.add("lit"); });
  }

  // Reveal on scroll.
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); countUp(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  // (A fully clipped box never counts as visible, so .clip boxes open with their parent card.)
  $$(".rv, [data-split]:not([data-split='blur'])").forEach(function (el) { io.observe(el); });

  // Hero: photo opens, headline fades in word by word.
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    $$("[data-hero], [data-split='blur']").forEach(function (el) { el.classList.add("in"); });
  }); });

  // Numbers count up once.
  function countUp(scope) {
    $$("[data-count]", scope).forEach(function (n) {
      var to = +n.dataset.count;
      if (reduce || !to) return;
      var t0 = null;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1400, 1);
        n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // Header: solid after the top, hides on the way down, returns on the way up.
  var hdr = $(".hdr"), lastY = window.scrollY, megaOpen = false, menuOpen = false;
  var drift = $$("[data-drift]"), par = $$("[data-par]");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY, vh = window.innerHeight;
    hdr.classList.toggle("solid", y > 8);
    if (!megaOpen && !menuOpen && Math.abs(y - lastY) > 4) {
      hdr.classList.toggle("hide", y > lastY && y > 320);
      lastY = y;
    }
    if (!reduce) {
      drift.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
        el.style.transform = "translate3d(" + ((p - 0.5) * 2 * 7 * +el.dataset.drift) + "vw,0,0)";
      });
      par.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var off = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform = "translate3d(0," + (off * -100 * +img.dataset.par) + "%,0)";
      });
      if (fill) {
        var fr = fill.getBoundingClientRect();
        var fp = Math.max(0, Math.min(1, (vh * 0.85 - fr.top) / (fr.height + vh * 0.3)));
        var lit = Math.round(fp * fillWords.length);
        fillWords.forEach(function (w, k) { w.classList.toggle("lit", k < lit); });
      }
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Mega menu under "Services".
  var megaBtn = $("[data-mega]"), mega = $("#mega"), closeT;
  function setMega(open) {
    megaOpen = open;
    megaBtn.setAttribute("aria-expanded", open);
    mega.classList.toggle("open", open);
    hdr.classList.toggle("open", open);
    if (open) hdr.classList.remove("hide");
  }
  megaBtn.addEventListener("click", function () { setMega(!megaOpen); });
  if (window.matchMedia("(hover: hover)").matches) {
    megaBtn.addEventListener("mouseenter", function () { clearTimeout(closeT); setMega(true); });
    [megaBtn, mega].forEach(function (el) {
      el.addEventListener("mouseleave", function () { closeT = setTimeout(function () { setMega(false); }, 220); });
      el.addEventListener("mouseenter", function () { clearTimeout(closeT); });
    });
  }
  $$("a", mega).forEach(function (a) { a.addEventListener("click", function () { setMega(false); }); });
  document.addEventListener("click", function (e) { if (megaOpen && !hdr.contains(e.target)) setMega(false); });

  // Phone and tablet menu.
  var menuBtn = $("[data-menu]"), menu = $("#menu");
  function setMenu(open) {
    menuOpen = open;
    menuBtn.setAttribute("aria-expanded", open);
    menu.classList.toggle("open", open);
    hdr.classList.toggle("open", open);
    hdr.classList.remove("hide");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var first = $("a", menu); if (first) first.focus({ preventScroll: true }); }
  }
  menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.addEventListener("resize", function () { if (menuOpen && window.innerWidth > 1023) setMenu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (megaOpen) { setMega(false); megaBtn.focus(); }
    if (menuOpen) { setMenu(false); menuBtn.focus(); }
  });

  // How a visit works: the step in the middle of the screen drives the photo.
  var steps = $$("[data-step]"), shots = $$("[data-shot]"), vnum = $("[data-vnum]");
  var sio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var k = +e.target.dataset.step;
      steps.forEach(function (s, j) { s.classList.toggle("on", j === k); });
      shots.forEach(function (s, j) { s.classList.toggle("on", j === k); });
      vnum.textContent = "0" + (k + 1);
    });
  }, { rootMargin: "-50% 0px -50% 0px" });
  steps.forEach(function (s) { sio.observe(s); });

  // A service button picks the matching topic in the form.
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () {
      var r = $('#f-contact input[name="service"][value="' + a.dataset.service + '"]');
      if (r) r.checked = true;
    });
  });

  // Form: thanks only when Formgong answers success: true.
  var form = $("#f-contact"), button = $(".submit", form), label = $("[data-send-label]", form), status = $("[data-status]", form);
  function say(text, bad) { status.textContent = text; status.classList.toggle("err", !!bad); }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    button.disabled = true; label.textContent = "Sending…"; say("");
    var first = (form.elements.namedItem("name").value || "").trim().split(/\s+/)[0];
    fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
      .then(function (res) { return res.json().catch(function () { return null; }); })
      .then(function (result) {
        if (result && result.success === true) {
          $("[data-name]", form).textContent = first || "there";
          form.reset();
          form.classList.add("is-sent");
          $(".thanks", form).focus();
        } else {
          say((result && result.message) || "Could not send. Please try again or call us.", true);
        }
      })
      .catch(function () { say("Could not send. Check your connection and try again.", true); })
      .then(function () { button.disabled = false; label.textContent = "Request a visit"; });
  });
  $("[data-again]", form).addEventListener("click", function () { form.classList.remove("is-sent"); say(""); form.elements.namedItem("name").focus(); });
})();
