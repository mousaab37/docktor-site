// Tags input (languages): type a word and press Enter (or comma) to add it; × removes it.
// The values are sent as hidden inputs named `<name>_0`, `<name>_1`, …
document.querySelectorAll<HTMLElement>("[data-tags]").forEach((box) => {
  const name = box.dataset.tags ?? "tag";
  const max = Number(box.dataset.max ?? 6);
  const list = box.querySelector<HTMLElement>("[data-tag-list]");
  const input = box.querySelector<HTMLInputElement>("[data-tag-input]");
  if (!list || !input) return;

  const values = (): string[] => [...list.querySelectorAll<HTMLElement>("[data-tag]")].map((t) => t.dataset.tag ?? "");

  const sync = () => {
    list.querySelectorAll<HTMLInputElement>("input[type=hidden]").forEach((h) => h.remove());
    values().forEach((v, i) => {
      const h = document.createElement("input");
      h.type = "hidden";
      h.name = `${name}_${i}`;
      h.value = v;
      list.append(h);
    });
    input.disabled = values().length >= max;
  };

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || values().includes(v) || values().length >= max) return;
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.dataset.tag = v;
    chip.append(document.createTextNode(v));
    const x = document.createElement("button");
    x.type = "button";
    x.setAttribute("aria-label", `إزالة ${v}`);
    x.textContent = "×";
    chip.append(x);
    list.insertBefore(chip, list.querySelector("input[type=hidden]"));
    sync();
  };

  list.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (b) {
      b.closest("[data-tag]")?.remove();
      sync();
      input.focus();
    }
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "،") {
      e.preventDefault(); // Enter must not submit the form
      add(input.value);
      input.value = "";
    } else if (e.key === "Backspace" && input.value === "") {
      list.querySelector("[data-tag]:last-of-type")?.remove();
      sync();
    }
  });
  // A word left in the box when the form is sent still counts.
  input.form?.addEventListener("submit", () => {
    add(input.value);
    input.value = "";
  });
  sync();
});
