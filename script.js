// Lấy element
const menuSection = document.getElementById('menu-section');
const recipePanel = document.getElementById('recipe-panel');
const panelTitle = document.getElementById('panel-title');
const panelSize = document.getElementById('panel-size');
const panelImgSrc = document.getElementById('panel-img-src');
const panelIngredients = document.getElementById('panel-ingredients');
const panelSteps = document.getElementById('panel-steps');
const closePanel = document.getElementById('close-panel');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');

let recipes = [];

// Load dữ liệu menu
fetch('recipes.json')
  .then(res => res.json())
  .then(data => {
    recipes = data;
    renderMenu(recipes);
  });

// Render menu
function renderMenu(list) {
  menuSection.innerHTML = '';
  list.forEach(item => {
    const card = document.createElement('div');
    card.classList.add('menu-card', 'glass');
    card.innerHTML = `
      <img src="${item.hinhAnh}" alt="${item.tenMon}">
      <h3>${item.tenMon}</h3>
    `;
    card.addEventListener('click', () => openPanel(item));
    menuSection.appendChild(card);
  });
}

// Mở panel công thức
function openPanel(item) {
  panelTitle.textContent = item.tenMon;
  panelSize.textContent = `Dung tích: ${item.dungLuong}`;
  panelImgSrc.src = item.hinhAnh;
  panelIngredients.innerHTML = item.nguyenLieu.map(nl => `<li>${nl}</li>`).join('');
  panelSteps.innerHTML = item.congThuc.map(ct => `<li>${ct}</li>`).join('');
  recipePanel.classList.add('active');
}

// Đóng panel công thức
closePanel.addEventListener('click', () => {
  recipePanel.classList.remove('active');
});

// Lọc theo nhóm món (category filter)
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    btn.classList.add('active');

    const category = btn.getAttribute('data-category');
    const specialFilter = btn.getAttribute('data-filter');

    // Nếu bấm "Chưa có công thức"
    if (specialFilter === 'no-recipe') {
      const filtered = recipes.filter(item => 
        item.congThuc.length === 1 && item.congThuc[0] === "Chưa có công thức"
      );
      renderMenu(filtered);
      return;
    }

    // Nếu bấm "Tất cả"
    if (category === 'all') {
      renderMenu(recipes);
    } 
    // Nếu bấm nhóm món
    else if (category) {
      renderMenu(recipes.filter(item => item.category === category));
    }
  });
});


// Tìm kiếm realtime
searchInput.addEventListener('input', function () {
  const keyword = this.value.toLowerCase();
  const filtered = recipes.filter(item =>
    item.tenMon.toLowerCase().includes(keyword)
  );
  renderMenu(filtered);
});

const searchIngredientInput = document.getElementById('search-ingredient');

searchIngredientInput.addEventListener('input', function () {
  const keyword = this.value.toLowerCase().trim();

  if (!keyword) {
    renderMenu(recipes); // Nếu không nhập gì thì hiện tất cả
    return;
  }

  const filtered = recipes.filter(item =>
    item.nguyenLieu.some(nl => nl.toLowerCase().includes(keyword))
  );

  renderMenu(filtered);
});
