// Repeatable rows for the dashboard forms (bio paragraphs, education, experience, social accounts).
// Markup: <div data-rows data-max="6"> <div data-row>…inputs named x_0…</div> <template data-row-template>…x___i__…</template> <button data-add-row> </div>
// After every add / remove, the field names are renumbered (`…_0`, `…_1`, …) so the server reads them in order.
function reindex(box: HTMLElement): void {
  box.querySelectorAll<HTMLElement>("[data-row]").forEach((row, i) => {
    row.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[name]").forEach((el) => {
      el.name = el.name.replace(/_(\d+|__i__)$/, `_${i}`);
    });
  });
}

function update(box: HTMLElement): void {
  const max = Number(box.dataset.max ?? 6);
  const count = box.querySelectorAll("[data-row]").length;
  const add = box.querySelector<HTMLButtonElement>("[data-add-row]");
  if (add) add.disabled = count >= max;
}

document.querySelectorAll<HTMLElement>("[data-rows]").forEach((box) => {
  const list = box.querySelector<HTMLElement>("[data-row-list]") ?? box;
  const tpl = box.querySelector<HTMLTemplateElement>("template[data-row-template]");
  box.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-add-row]") && tpl) {
      const max = Number(box.dataset.max ?? 6);
      if (box.querySelectorAll("[data-row]").length >= max) return;
      list.append(tpl.content.cloneNode(true));
      reindex(box);
      update(box);
      list.querySelector<HTMLElement>("[data-row]:last-of-type input, [data-row]:last-of-type textarea")?.focus();
    }
    const rm = target.closest("[data-remove-row]");
    if (rm) {
      rm.closest("[data-row]")?.remove();
      reindex(box);
      update(box);
    }
  });
  update(box);
});
