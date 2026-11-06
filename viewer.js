const root = document.documentElement;
const base = root.dataset.base ?? "";
const progress = document.querySelector(".reading-progress");

function createPages(slices) {
  const byPage = new Map();
  for (const slice of slices) {
    const group = byPage.get(slice.page) ?? [];
    group.push(slice);
    byPage.set(slice.page, group);
  }

  for (const [page, items] of byPage) {
    const container = document.querySelector(`[data-page="${page}"]`);
    if (!container) continue;

    const fragment = document.createDocumentFragment();
    for (const [index, item] of items.entries()) {
      const image = document.createElement("img");
      image.className = "manual-slice";
      image.src = `${base}${item.src}`;
      if (item.srcMobile) {
        image.srcset = `${base}${item.srcMobile} 640w, ${base}${item.src} 960w`;
        image.sizes = "(max-width: 600px) calc(100vw - 12px), min(920px, calc(100vw - 32px))";
      }
      image.alt = item.alt;
      image.width = item.width;
      image.height = item.height;
      image.loading = page === 1 && index === 0 ? "eager" : "lazy";
      image.fetchPriority = page === 1 && index === 0 ? "high" : "low";
      image.decoding = "async";
      image.draggable = false;
      image.addEventListener(
        "load",
        () => {
          image.classList.add("is-loaded");
          updateProgress();
        },
        { once: true },
      );
      fragment.append(image);
    }
    container.append(fragment);
  }
  requestAnimationFrame(updateProgress);
}

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
  progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;

}

document.addEventListener("contextmenu", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains("manual-slice")) {
    event.preventDefault();
  }
});

document.addEventListener("dragstart", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains("manual-slice")) {
    event.preventDefault();
  }
});

if (window.HANDBOOK_DATA) {
  createPages(window.HANDBOOK_DATA.slices);
} else {
  fetch(`${base}responsive-slices.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Cannot load handbook: ${response.status}`);
      return response.json();
    })
    .then((data) => createPages(data.slices))
    .catch((error) => {
      console.error(error);
      const message = document.createElement("p");
      message.className = "noscript";
      message.textContent = "在线阅读内容暂时未能载入，请稍后刷新。";
      document.querySelector(".document").replaceChildren(message);
    });
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
