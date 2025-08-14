let recipes = [];

async function fetchData() {
  const response = await fetch("recipes.json");
  recipes = await response.json();
  renderRecipes(recipes);
}
fetchData();

const menuSection = document.getElementById("menu-section");
const searchInput = document.getElementById("search");
const ingredientInput = document.getElementById("search-ingredient");

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

function showRecipe(item) {
  document.getElementById("panel-title").textContent = item.tenMon;
  document.getElementById("panel-size").textContent = item.dungLuong;
  document.getElementById("panel-img-src").src = item.hinhAnh;

  const ingredientsList = document.getElementById("panel-ingredients");
  ingredientsList.innerHTML = "";
  item.nguyenLieu.forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  const stepsList = document.getElementById("panel-steps");
  stepsList.innerHTML = "";
  item.congThuc.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  openPanel();
}

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.toLowerCase();
  const filtered = recipes.filter(r => r.tenMon.toLowerCase().includes(keyword));
  renderRecipes(filtered);
});

ingredientInput.addEventListener("input", () => {
  const keyword = ingredientInput.value.toLowerCase();
  const filtered = recipes.filter(r => r.nguyenLieu.some(i => i.toLowerCase().includes(keyword)));
  renderRecipes(filtered);
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const cat = btn.dataset.category;
    const noRecipe = btn.dataset.filter === "no-recipe";

    const filtered = recipes.filter(r =>
      (cat === "all" || r.category === cat) &&
      (!noRecipe || r.congThuc[0] === "Chưa có công thức")
    );
    renderRecipes(filtered);
  });
});

// === Modal logic ===
const panel = document.getElementById("recipe-panel");
const overlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-panel");

function openPanel() {
  panel.classList.add("active");
  overlay.classList.add("active");
}

function closePanel() {
  panel.classList.remove("active");
  overlay.classList.remove("active");
}

closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
