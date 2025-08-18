let recipes = [];

/* ===== Data load ===== */
async function fetchData() {
  const response = await fetch("recipes.json");
  recipes = await response.json();
  renderDefault();
}
fetchData();

/* ===== Elements ===== */
const menuSection = document.getElementById("menu-section");
const searchInput = document.getElementById("search");
const ingredientInput = document.getElementById("search-ingredient");

const panel = document.getElementById("recipe-panel");
const overlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-panel");

/* ===== Render helpers ===== */

/** Card có ảnh cho menu thường */
function renderCardsNormal(list) {
  menuSection.style.display = "grid";
  menuSection.innerHTML = "";

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card";
    const imgSrc = item.hinhAnh || "images/placeholder.png";
    card.innerHTML = `
      <img src="${imgSrc}" alt="${item.tenMon}">
      <h3>${item.tenMon}</h3>
    `;
    card.addEventListener("click", () => showRecipe(item));
    menuSection.appendChild(card);
  });
}

/** Card chỉ có tên (không hình) cho nhóm Prepared */
function renderCardsPrepared(list) {
  menuSection.style.display = "grid";
  menuSection.innerHTML = "";

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "menu-card prepared-card";
    card.innerHTML = `<h3>🅂 ${item.tenMon}</h3>`;
    card.addEventListener("click", () => showRecipe(item));
    menuSection.appendChild(card);
  });
}

/** Router: nếu toàn bộ là Prepared -> dùng card tên; ngược lại dùng card thường */
function renderRecipes(list) {
  if (list.length > 0 && list.every(x => x.category === "Prepared")) {
    renderCardsPrepared(list);
  } else {
    renderCardsNormal(list);
  }
}

/** Mặc định = tab "Tất cả" nhưng loại trừ Prepared */
function renderDefault() {
  const list = recipes.filter(r => r.category !== "Prepared");
  renderCardsNormal(list);
}

/* ===== Popup / Dialog ===== */

function showRecipe(item) {
  // Tiêu đề, size
  document.getElementById("panel-title").textContent = item.tenMon || "";
  document.getElementById("panel-size").textContent = item.dungLuong || "";

  // Ảnh (chỉ hiển thị cho non-Prepared)
  const imgWrap = panel.querySelector(".panel-img");
  const img = document.getElementById("panel-img-src");
  if (item.category === "Prepared") {
    panel.classList.add("is-prepared");
    img.src = "";
    img.alt = "";
  } else {
    panel.classList.remove("is-prepared");
    img.src = item.hinhAnh || "";
    img.alt = item.tenMon || "";
  }

  // Nguyên liệu
  const ingredientsList = document.getElementById("panel-ingredients");
  ingredientsList.innerHTML = "";

  // Với Prepared: tách chuỗi "Tên NL: 10 ml" cho rõ ràng (giữ nguyên hiển thị dạng dòng)
  (item.nguyenLieu || []).forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  // Công thức (ẩn nếu không có step hợp lệ)
  const stepsTitle = document.getElementById("steps-title");
  const stepsList = document.getElementById("panel-steps");
  stepsList.innerHTML = "";
  const steps = (item.congThuc || []).filter(s => {
    const t = (s || "").trim().toLowerCase();
    return t && !t.includes("chưa có công thức");
  });

  if (steps.length === 0) {
    stepsTitle.style.display = "none";
    stepsList.style.display = "none";
  } else {
    stepsTitle.style.display = "";
    stepsList.style.display = "";
    steps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsList.appendChild(li);
    });
  }

  openPanel();
}

function openPanel() {
  panel.classList.add("active");
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  // Tránh nhảy viewport trên mobile (coarse pointers)
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  if (!isCoarse) {
    panel.focus();
  }
}

function closePanel() {
  panel.classList.remove("active");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closePanel();
});

/* ===== Search & Filters (theo tab đang mở) ===== */

function getActiveCategory() {
  const activeBtn = document.querySelector(".filter-btn.active");
  return activeBtn?.dataset.category || "all";
}

function getBaseListByActiveTab() {
  const cat = getActiveCategory();
  if (cat === "all") return recipes.filter(r => r.category !== "Prepared");
  return recipes.filter(r => r.category === cat);
}

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const base = getBaseListByActiveTab();
  const filtered = base.filter(r => (r.tenMon || "").toLowerCase().includes(keyword));
  renderRecipes(filtered);
});

ingredientInput.addEventListener("input", () => {
  const keyword = ingredientInput.value.trim().toLowerCase();
  const base = getBaseListByActiveTab();
  const filtered = base.filter(r =>
    (r.nguyenLieu || []).some(i => (i || "").toLowerCase().includes(keyword))
  );
  renderRecipes(filtered);
});

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const cat = btn.dataset.category || "all";
    let filtered;
    if (cat === "all") {
      filtered = recipes.filter(r => r.category !== "Prepared");
    } else {
      filtered = recipes.filter(r => r.category === cat);
    }
    renderRecipes(filtered);

    // Reset ô tìm kiếm khi đổi tab để tránh lọc chéo gây rỗng
    searchInput.value = "";
    ingredientInput.value = "";
  });
});
