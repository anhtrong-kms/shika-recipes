let recipes = [];

/* ===== Data load ===== */
async function fetchData() {
  const response = await fetch("recipes.json");
  recipes = await response.json();
  renderRecipes(recipes);
}
fetchData();

/* ===== Elements ===== */
const menuSection = document.getElementById("menu-section");
const searchInput = document.getElementById("search");
const ingredientInput = document.getElementById("search-ingredient");

const panel = document.getElementById("recipe-panel");
const overlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-panel");

/* ===== Render cards ===== */
function renderRecipes(list) {
  menuSection.innerHTML = "";
  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    card.innerHTML = `
      <img src="${item.hinhAnh}" alt="${item.tenMon}">
      <h3>${item.tenMon}</h3>
    `;
    card.addEventListener("click", () => showRecipe(item));
    menuSection.appendChild(card);
  });
}

/* ===== Show dialog content ===== */
function showRecipe(item) {
  document.getElementById("panel-title").textContent = item.tenMon || "";
  document.getElementById("panel-size").textContent = item.dungLuong || "";
  const img = document.getElementById("panel-img-src");
  img.src = item.hinhAnh || "";
  img.alt = item.tenMon || "";

  const ingredientsList = document.getElementById("panel-ingredients");
  ingredientsList.innerHTML = "";
  (item.nguyenLieu || []).forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  const stepsList = document.getElementById("panel-steps");
  stepsList.innerHTML = "";
  (item.congThuc || []).forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  openPanel();
}

/* ===== Search & Filters ===== */
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = recipes.filter(r => (r.tenMon || "").toLowerCase().includes(keyword));
  renderRecipes(filtered);
});

ingredientInput.addEventListener("input", () => {
  const keyword = ingredientInput.value.trim().toLowerCase();
  const filtered = recipes.filter(r =>
    (r.nguyenLieu || []).some(i => (i || "").toLowerCase().includes(keyword))
  );
  renderRecipes(filtered);
});

/* Robust "no-recipe" check */
function hasNoRecipe(r) {
  if (!r.congThuc || r.congThuc.length === 0) return true;
  return r.congThuc.some(step => (step || "").toLowerCase().includes("chưa có công thức"));
}

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const cat = btn.dataset.category || "all";
    const isNoRecipe = btn.dataset.filter === "no-recipe";

    const filtered = recipes.filter(r =>
      (cat === "all" || r.category === cat) &&
      (!isNoRecipe || hasNoRecipe(r))
    );
    renderRecipes(filtered);
  });
});

/* ===== Modal logic ===== */
function openPanel() {
  panel.classList.add("active");
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  // focus management (accessibility)
  panel.focus();
}

function closePanel() {
  panel.classList.remove("active");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

// Close events
closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanel();
});
