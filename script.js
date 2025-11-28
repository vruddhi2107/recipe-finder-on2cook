let recipes = [];

// Desktop elements
const dietTypeChipGroup = document.getElementById('dietTypeChipGroup');
const cookingTime = document.getElementById('cookingTime');
const cookingTimeLabel = document.getElementById('cookingTimeLabel');
const cookingModeRadioGroup = document.getElementById('cookingModeRadioGroup');
const cuisineRadioGroup = document.getElementById('cuisineRadioGroup');
const categoryRadioGroup = document.getElementById('categoryRadioGroup');
const clearBtn = document.getElementById('clearBtn');
const recipesGrid = document.getElementById('recipesGrid');
const recipeCountEl = document.getElementById('recipeCount');

// Mobile elements
const mobileFilterBtn = document.getElementById('mobileFilterBtn');
const mobileFilterModal = document.getElementById('mobileFilterModal');
const closeMobileFilter = document.getElementById('closeMobileFilter');
const searchBarMobile = document.getElementById('searchBarMobile');
const dietTypeMobile = document.getElementById('dietTypeMobile');
const cookingModeMobile = document.getElementById('cookingModeMobile');
const cuisineMobile = document.getElementById('cuisineMobile');
const categoryMobile = document.getElementById('categoryMobile');
const accessoryMobile = document.getElementById('accessoryMobile');
const cookingTimeMobile = document.getElementById('cookingTimeMobile');
const cookingTimeLabelMobile = document.getElementById('cookingTimeLabelMobile');
const clearBtnMobile = document.getElementById('clearBtnMobile');

// Popup elements
const popupModal = document.getElementById('popupModal');
const popupImage = document.getElementById('popupImage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// FILTER STATE
const filterState = {
  searchTerm: '',
  dietVal: 'All',
  cookingModeVal: 'All',
  cuisineVal: 'All',
  categoryVal: 'All',
  accessoryVal: 'All',
  maxCookingTime: 35
};

// Helpers
function getUniqueValues(key) {
  const set = new Set(recipes.map(r => r[key]).filter(Boolean));
  return Array.from(set).sort();
}
function getUniqueAccessories() {
  const s = new Set();
  recipes.forEach(r => {
    if (r['Accessories']) {
      r['Accessories'].split(',').forEach(a => s.add(a.trim()));
    }
  });
  return Array.from(s).sort();
}

// Build chips/radios
function buildDietChips(values) {
  dietTypeChipGroup.innerHTML = '';
  const allValues = ['All', ...values];
  allValues.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'diet-chip' + (val === 'All' ? ' active' : '');
    btn.dataset.value = val;
    btn.innerHTML =
      val === 'All'
        ? '<span class="diet-chip-icon">🍽</span><span>All</span>'
        : val === 'VEG'
        ? '<span class="diet-chip-icon veg-dot"></span><span>Veg</span>'
        : '<span class="diet-chip-icon nonveg-dot"></span><span>Non Veg</span>';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diet-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      filterState.dietVal = val;
      showRecipes();
    });
    dietTypeChipGroup.appendChild(btn);
  });
}

function buildRadioGroup(container, values, name) {
  container.innerHTML = '';
  const allValues = ['All', ...values];
  allValues.forEach(val => {
    const label = document.createElement('label');
    label.className = 'radio-pill';
    label.innerHTML = `
      <input type="radio" name="${name}" value="${val}" ${val === 'All' ? 'checked' : ''}>
      <span>${val}</span>
    `;
    const input = label.querySelector('input');
    input.addEventListener('change', () => {
      filterState[`${name}Val`] = val;
      showRecipes();
    });
    container.appendChild(label);
  });
}

// Populate mobile selects
function populateMobileFilters() {
  const setOptions = (select, values) => {
    select.innerHTML = '<option value="All">All</option>';
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  };
  setOptions(dietTypeMobile, getUniqueValues('Veg/Non Veg'));
  setOptions(cookingModeMobile, getUniqueValues('Cooking Mode'));
  setOptions(cuisineMobile, getUniqueValues('Cuisine'));
  setOptions(categoryMobile, getUniqueValues('Category'));
  setOptions(accessoryMobile, getUniqueAccessories());
}

// Load recipes
function loadRecipes() {
  fetch('recipes_out.json')
    .then(r => r.json())
    .then(data => {
      recipes = data;
      buildDietChips(getUniqueValues('Veg/Non Veg'));
      buildRadioGroup(cookingModeRadioGroup, getUniqueValues('Cooking Mode'), 'cookingMode');
      buildRadioGroup(cuisineRadioGroup, getUniqueValues('Cuisine'), 'cuisine');
      buildRadioGroup(categoryRadioGroup, getUniqueValues('Category'), 'category');
      populateMobileFilters();
      showRecipes();
    })
    .catch(() => {
      recipesGrid.innerHTML = '<p class="error-text">Failed to load recipes.</p>';
    });
}

// Filtering
function filterRecipes() {
  return recipes.filter(r => {
    const searchOk =
      !filterState.searchTerm ||
      (r['Recipe Name'] || '').toLowerCase().includes(filterState.searchTerm);

    const dietOk =
      filterState.dietVal === 'All' || r['Veg/Non Veg'] === filterState.dietVal;

    const modeOk =
      filterState.cookingModeVal === 'All' || r['Cooking Mode'] === filterState.cookingModeVal;

    const cuisineOk =
      filterState.cuisineVal === 'All' || r['Cuisine'] === filterState.cuisineVal;

    const catOk =
      filterState.categoryVal === 'All' || r['Category'] === filterState.categoryVal;

    const accOk =
      filterState.accessoryVal === 'All' ||
      (r['Accessories'] &&
        r['Accessories'].split(',').map(a => a.trim()).includes(filterState.accessoryVal));

    const timeOk =
      r['On2Cook Cooking Time'] &&
      parseInt(r['On2Cook Cooking Time'], 10) <= filterState.maxCookingTime;

    return searchOk && dietOk && modeOk && cuisineOk && catOk && accOk && timeOk;
  });
}

// Render recipes
function showRecipes() {
  const filtered = filterRecipes().sort((a, b) => {
    const ta = parseInt(a['On2Cook Cooking Time'], 10) || 0;
    const tb = parseInt(b['On2Cook Cooking Time'], 10) || 0;
    return ta - tb;
  });

  recipeCountEl.textContent = `${filtered.length} recipes found`;
  recipesGrid.innerHTML = '';

  if (filtered.length === 0) {
    recipesGrid.innerHTML = '<p class="empty-text">No recipes found matching your filters.</p>';
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const cleanTime =
      r['Normal Cooking Time']?.replace(/[.,;!?'"()-]/g, '') || '';

    card.innerHTML = `
      <div class="recipe-card-image-wrap">
        <img src="${r.Image}" alt="${r['Recipe Name']}" class="recipe-image" />
        <div class="recipe-time-pill">${r['Total Output']}</div>
      </div>
      <div class="recipe-card-body">
        <div class="recipe-title-row">
          <h3 class="recipe-name">${r['Recipe Name']}</h3>
          <span class="diet-icon ${r['Veg/Non Veg'] === 'VEG' ? 'veg' : 'non-veg'}"></span>
        </div>
        <p class="recipe-meta">${r['Cuisine']} • ${r['Cooking Mode']} • ${r['Category']}</p>
        <div class="badge-row">
          <div class="badge on2cook">
            <span class="badge-icon">⚡</span>
            <span class="badge-text">On2Cook  ${r['On2Cook Cooking Time']} mins</span>
          </div>
          <div class="badge normal">
            <span class="badge-icon">⏱</span>
            <span class="badge-text">Normal  ${cleanTime}</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      openPopup(r.PopupImage || r.Image, r['Recipe Name']);
    });

    recipesGrid.appendChild(card);
  });
}

// Desktop interactions
cookingTime.addEventListener('input', () => {
  filterState.maxCookingTime = parseInt(cookingTime.value, 10);
  cookingTimeLabel.textContent = `${cookingTime.value} min`;
  showRecipes();
});

clearBtn.addEventListener('click', () => {
  filterState.searchTerm = '';
  filterState.dietVal = 'All';
  filterState.cookingModeVal = 'All';
  filterState.cuisineVal = 'All';
  filterState.categoryVal = 'All';
  filterState.accessoryVal = 'All';
  filterState.maxCookingTime = 35;

  cookingTime.value = 35;
  cookingTimeLabel.textContent = '35 min';

  document.querySelectorAll('.diet-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === 'All');
  });
  ['cookingMode', 'cuisine', 'category'].forEach(name => {
    const allInput = document.querySelector(`input[name="${name}"][value="All"]`);
    if (allInput) allInput.checked = true;
  });

  // reset mobile too
  dietTypeMobile.value = 'All';
  cookingModeMobile.value = 'All';
  cuisineMobile.value = 'All';
  categoryMobile.value = 'All';
  accessoryMobile.value = 'All';
  cookingTimeMobile.value = 35;
  cookingTimeLabelMobile.textContent = '35';

  showRecipes();
});

// Mobile modal controls
mobileFilterBtn.addEventListener('click', () => {
  mobileFilterModal.classList.add('active');
});
closeMobileFilter.addEventListener('click', () => {
  mobileFilterModal.classList.remove('active');
});
mobileFilterModal.addEventListener('click', e => {
  if (e.target === mobileFilterModal) {
    mobileFilterModal.classList.remove('active');
  }
});

// Mobile filter handlers
function applyMobileFilters() {
  filterState.searchTerm = (searchBarMobile.value || '').toLowerCase().trim();
  filterState.dietVal = dietTypeMobile.value;
  filterState.cookingModeVal = cookingModeMobile.value;
  filterState.cuisineVal = cuisineMobile.value;
  filterState.categoryVal = categoryMobile.value;
  filterState.accessoryVal = accessoryMobile.value;
  filterState.maxCookingTime = parseInt(cookingTimeMobile.value, 10);
  cookingTimeLabelMobile.textContent = cookingTimeMobile.value;
  showRecipes();
}
searchBarMobile.addEventListener('input', debounce(applyMobileFilters, 250));
dietTypeMobile.addEventListener('change', applyMobileFilters);
cookingModeMobile.addEventListener('change', applyMobileFilters);
cuisineMobile.addEventListener('change', applyMobileFilters);
categoryMobile.addEventListener('change', applyMobileFilters);
accessoryMobile.addEventListener('change', applyMobileFilters);
cookingTimeMobile.addEventListener('input', applyMobileFilters);

clearBtnMobile.addEventListener('click', () => {
  searchBarMobile.value = '';
  dietTypeMobile.value = 'All';
  cookingModeMobile.value = 'All';
  cuisineMobile.value = 'All';
  categoryMobile.value = 'All';
  accessoryMobile.value = 'All';
  cookingTimeMobile.value = 35;
  cookingTimeLabelMobile.textContent = '35';
  applyMobileFilters();
});

// Popup
function openPopup(src, alt) {
  popupImage.src = src;
  popupImage.alt = alt || 'Recipe Image';
  popupModal.style.display = 'flex';
}
popupCloseBtn.addEventListener('click', () => {
  popupModal.style.display = 'none';
});
popupModal.addEventListener('click', e => {
  if (e.target === popupModal) popupModal.style.display = 'none';
});

// Debounce
function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Init
window.addEventListener('load', loadRecipes);
