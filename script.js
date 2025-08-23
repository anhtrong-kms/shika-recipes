let recipes = [];
let preparedIndex = new Map(); // Map tên chuẩn hóa -> object món Prepared

/* ===== Nạp dữ liệu ===== */
async function fetchData() {
  const response = await fetch("recipes.json");
  recipes = await response.json();

  // Lập chỉ mục cho nhóm Prepared để tra cứu nhanh
  preparedIndex = new Map(
    recipes
      .filter(r => r.category === "Prepared")
      .map(r => [normalizeName(r.tenMon), r])
  );

  renderDefault();
}
fetchData();

/* ===== Phần tử DOM ===== */
const menuSection = document.getElementById("menu-section");
const searchInput = document.getElementById("search");
const ingredientInput = document.getElementById("search-ingredient");

const panel = document.getElementById("recipe-panel");
const overlay = document.getElementById("modal-overlay");
const closeBtn = document.getElementById("close-panel");

const prepMini = document.getElementById("prep-mini");
const prepMiniClose = document.getElementById("prep-mini-close");
const prepMiniTitle = document.getElementById("prep-mini-title");
const prepMiniIngredients = document.getElementById("prep-mini-ingredients");
const prepMiniStepsTitle = document.getElementById("prep-mini-steps-title");
const prepMiniSteps = document.getElementById("prep-mini-steps");

/* ===== Utils ===== */
function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // bỏ dấu tiếng Việt
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tìm các "nguyên liệu thành phẩm" xuất hiện trong danh sách nguyenLieu của món.
 * So khớp substring không dấu/không phân biệt hoa thường.
 */
function findPreparedRefsOfRecipe(recipe) {
  const results = [];
  const ingredients = recipe?.nguyenLieu || [];
  const preparedNames = Array.from(preparedIndex.keys()); // normalized

  for (const line of ingredients) {
    const normLine = normalizeName(line);
    for (const pName of preparedNames) {
      if (normLine.includes(pName)) {
        const obj = preparedIndex.get(pName);
        if (obj && !results.some(x => x.tenMon === obj.tenMon)) {
          results.push(obj);
        }
      }
    }
  }
  return results;
}

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
    card.innerHTML = `<h3>🆂 ${item.tenMon}</h3>`;
    card.addEventListener("click", () => showRecipe(item));
    menuSection.appendChild(card);
  });
}

/** Router: nếu toàn bộ là Prepared -> card tên; ngược lại -> card thường */
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

/* ===== Pop-up lớn ===== */

function showRecipe(item) {
  // Tiêu đề, size
  document.getElementById("panel-title").textContent = item.tenMon || "";
  document.getElementById("panel-size").textContent = item.dungLuong || "";

  // Ảnh (ẩn nếu Prepared)
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
  (item.nguyenLieu || []).forEach((ing) => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  // Chips "Xem cách làm" cho các Prepared có trong công thức (chỉ xuất hiện với món thường)
  const refList = document.getElementById("prepared-ref-list");
  refList.innerHTML = "";
  if (item.category !== "Prepared") {
    const refs = findPreparedRefsOfRecipe(item);
    if (refs.length > 0) {
      refs.forEach(ref => {
        const chip = document.createElement("button");
        chip.className = "prepared-ref-chip";
        chip.type = "button";
        chip.textContent = `Xem cách làm: ${ref.tenMon}`;
        chip.addEventListener("click", (e) => {
          e.stopPropagation();
          openPreparedMini(ref);
        });
        refList.appendChild(chip);
      });
    }
  }

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

  // Tránh nhảy viewport trên mobile
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  if (!isCoarse) panel.focus();
}

function closePanel() {
  panel.classList.remove("active");
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  closePreparedMini(); // đóng mini nếu đang mở
}

closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", () => {
  // Nếu mini đang mở, click overlay đóng cả 2
  if (prepMini.classList.contains("active")) closePreparedMini();
  closePanel();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (prepMini.classList.contains("active")) { closePreparedMini(); return; }
    closePanel();
  }
});

/* ===== Mini pop-up: định vị cạnh phải của popup lớn ===== */

function positionPreparedMiniRight() {
  // Nếu mini không mở -> bỏ qua
  if (!prepMini.classList.contains("active")) return;

  const panelRect = panel.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Kích thước mong muốn
  const miniWidth = Math.min(420, Math.floor(vw * 0.42));
  const miniHeight = Math.min(prepMini.offsetHeight || 400, Math.floor(vh * 0.8));
  const gap = 12; // khoảng cách giữa 2 popup

  // Vị trí đề xuất: dính cạnh phải panel
  let left = Math.round(panelRect.right + gap);
  let top = Math.round(panelRect.top);

  // Nếu tràn phải -> thử dính cạnh trái của panel
  if (left + miniWidth > vw) {
    left = Math.round(panelRect.left - gap - miniWidth);
  }

  // Nếu vẫn không đặt được (màn quá hẹp hoặc panel full-screen) -> fallback center
  const cannotPlaceSide = (left < 0) || (panelRect.width >= vw - 40);
  if (cannotPlaceSide) {
    prepMini.classList.remove("side");
    // reset để dùng transform center mặc định
    prepMini.style.left = "";
    prepMini.style.top = "";
    prepMini.style.width = "";
    prepMini.style.maxHeight = "";
    return;
  }

  // Clamp theo chiều dọc để không tràn
  const maxTop = Math.max(0, vh - miniHeight - 10);
  top = Math.min(Math.max(10, top), maxTop);

  // Áp toạ độ & kích thước
  prepMini.classList.add("side");
  prepMini.style.position = "fixed";
  prepMini.style.left = left + "px";
  prepMini.style.top = top + "px";
  prepMini.style.width = miniWidth + "px";
  prepMini.style.maxHeight = Math.min(vh - top - 10, Math.floor(vh * 0.8)) + "px";
}

/* ===== MINI POP-UP (Nguyên liệu thành phẩm: Nguyên liệu + Công thức) ===== */

function openPreparedMini(prepItem) {
  // Tiêu đề
  prepMiniTitle.textContent = prepItem.tenMon || "Nguyên liệu thành phẩm";

  // Nguyên liệu
  prepMiniIngredients.innerHTML = "";
  (prepItem.nguyenLieu || []).forEach(ing => {
    const li = document.createElement("li");
    li.textContent = ing;
    prepMiniIngredients.appendChild(li);
  });

  // Công thức (lọc bỏ dòng rỗng / "chưa có công thức")
  prepMiniSteps.innerHTML = "";
  const steps = (prepItem.congThuc || []).filter(s => {
    const t = (s || "").trim().toLowerCase();
    return t && !t.includes("chưa có công thức");
  });

  if (steps.length === 0) {
    prepMiniStepsTitle.style.display = "none";
    prepMiniSteps.style.display = "none";
  } else {
    prepMiniStepsTitle.style.display = "";
    prepMiniSteps.style.display = "";
    steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      prepMiniSteps.appendChild(li);
    });
  }

  // Mở mini
  prepMini.classList.add("active");
  prepMini.setAttribute("aria-hidden", "false");

  // Định vị cạnh phải của panel và gắn listener
  positionPreparedMiniRight();
  const _reposition = () => positionPreparedMiniRight();
  window.addEventListener("resize", _reposition);
  window.addEventListener("scroll", _reposition, { passive: true });
  prepMini._reposition = _reposition;
}

function closePreparedMini() {
  // Tháo listener và reset style
  if (prepMini._reposition) {
    window.removeEventListener("resize", prepMini._reposition);
    window.removeEventListener("scroll", prepMini._reposition);
    prepMini._reposition = null;
  }
  prepMini.classList.remove("side");
  prepMini.style.left = "";
  prepMini.style.top = "";
  prepMini.style.width = "";
  prepMini.style.maxHeight = "";

  prepMini.classList.remove("active");
  prepMini.setAttribute("aria-hidden", "true");
}
prepMiniClose.addEventListener("click", closePreparedMini);

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

    // Reset ô tìm kiếm khi đổi tab
    searchInput.value = "";
    ingredientInput.value = "";
  });
});
