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

const searchBarDesktop = document.getElementById('searchBarDesktop');
const sortTimeAsc = document.getElementById('sortTimeAsc');
const sortTimeDesc = document.getElementById('sortTimeDesc');

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

const sortTimeAscMobile = document.getElementById('sortTimeAscMobile');
const sortTimeDescMobile = document.getElementById('sortTimeDescMobile');

// Popup elements
const popupModal = document.getElementById('popupModal');
const popupImage = document.getElementById('popupImage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// FILTER STATE
const filterState = {
  searchTerm: '',
  sortBy: 'time-asc',
  dietVal: 'All',
  cookingModeVal: 'All',
  cuisineVal: 'All',
  categoryVal: 'All',
  accessoryVal: 'All',
  maxCookingTime: 35
};

searchBarDesktop?.addEventListener('input', debounce((e) => {
  filterState.searchTerm = e.target.value.toLowerCase().trim();
  showRecipes();
}, 250));

sortTimeAscMobile?.addEventListener('click', () => {
  filterState.sortBy = 'time-asc';
  updateMobileSortButtons();
  applyMobileFilters();
});

sortTimeDescMobile?.addEventListener('click', () => {
  filterState.sortBy = 'time-desc';
  updateMobileSortButtons();
  applyMobileFilters();
});

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

function setupSortButtons() {
  sortTimeAsc?.addEventListener('click', () => {
    filterState.sortBy = 'time-asc';
    updateSortButtons();
    showRecipes();
  });
  
  sortTimeDesc?.addEventListener('click', () => {
    filterState.sortBy = 'time-desc';
    updateSortButtons();
    showRecipes();
  });
}

function updateSortButtons() {
  sortTimeAsc?.classList.toggle('active', filterState.sortBy === 'time-asc');
  sortTimeDesc?.classList.toggle('active', filterState.sortBy === 'time-desc');
}

function updateMobileSortButtons() {
  sortTimeAscMobile?.classList.toggle('active', filterState.sortBy === 'time-asc');
  sortTimeDescMobile?.classList.toggle('active', filterState.sortBy === 'time-desc');
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
      setupSortButtons(); // Add this line
      updateSortButtons(); // Add this line
      updateMobileSortButtons();
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
  let filtered = filterRecipes();
  
  // Apply sorting based on filterState.sortBy
  filtered = filtered.sort((a, b) => {
    const ta = parseInt(a['On2Cook Cooking Time'], 10) || 999;
    const tb = parseInt(b['On2Cook Cooking Time'], 10) || 999;
    
    if (filterState.sortBy === 'time-asc') {
      return ta - tb;
    } else {
      return tb - ta;
    }
  });
  recipeCountEl.textContent = `${filtered.length} recipes found`;
  recipesGrid.innerHTML = '';

  if (filtered.length === 0) {
  recipesGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-illustration">
        <span class="empty-emoji">🍽️</span>
        <span class="empty-sparkle">✨</span>
      </div>
      <h3 class="empty-title">No recipes on this plate…</h3>
      <p class="empty-text">
        Try relaxing a filter or two, or switch cuisines to discover more delicious ideas.
      </p>
      <button class="empty-btn" type="button" onclick="document.getElementById('clearBtn').click()">
        Clear filters & explore
      </button>
    </div>
  `;
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
  filterState.sortBy = 'time-asc'; // Add this line
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

  updateSortButtons();
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
  filterState.sortBy = 'time-asc'; // Add this line
  updateMobileSortButtons();
  applyMobileFilters();
});

// Popup
// Enhanced Popup functionality - ZOOMS IN PLACE (no shifting)
let zoomState = {
  scale: 1,
  minScale: 0.5,
  maxScale: 4,
  translateX: 0,
  translateY: 0,
  isDragging: false,
  startX: 0,
  startY: 0
};

function openPopup(src, alt) {
  popupImage.src = src;
  popupImage.alt = alt || 'Recipe Image';
  resetZoom();
  popupModal.style.display = 'flex';
}

function resetZoom() {
  zoomState.scale = 1;
  zoomState.translateX = 0;
  zoomState.translateY = 0;
  updateImageTransform();
}

function updateImageTransform() {
  const transform = `translate(${zoomState.translateX}px, ${zoomState.translateY}px) scale(${zoomState.scale})`;
  popupImage.style.transform = transform;
}

function zoomImage(factor) {
  // ✅ SIMPLIFIED: Zoom in place - NO shifting/translation adjustment
  zoomState.scale = Math.max(zoomState.minScale, Math.min(zoomState.maxScale, zoomState.scale * factor));
  updateImageTransform();
}

// Event listeners for popup
popupCloseBtn.addEventListener('click', () => {
  popupModal.style.display = 'none';
});

popupModal.addEventListener('click', e => {
  if (e.target === popupModal) {
    popupModal.style.display = 'none';
  }
});

// Zoom controls
const zoomInBtn = document.querySelector('.zoom-in');
const zoomOutBtn = document.querySelector('.zoom-out');
const zoomResetBtn = document.querySelector('.zoom-reset');
const wrapper = popupImage.parentElement;

if (zoomInBtn) zoomInBtn.addEventListener('click', () => zoomImage(1.25));
if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => zoomImage(0.8));
if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);

// Image interaction events
popupImage.addEventListener('dblclick', resetZoom);

// Mouse wheel zoom - ZOOMS IN PLACE
wrapper.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.15;
  zoomImage(factor);  // No coordinates = no shifting
});

// Drag to pan (ONLY when zoomed)
wrapper.addEventListener('mousedown', (e) => {
  if (zoomState.scale > 1.01) {  // Only allow drag when actually zoomed
    zoomState.isDragging = true;
    zoomState.startX = e.clientX - zoomState.translateX;
    zoomState.startY = e.clientY - zoomState.translateY;
    wrapper.style.cursor = 'grabbing';
  }
});

document.addEventListener('mousemove', (e) => {
  if (zoomState.isDragging) {
    zoomState.translateX = e.clientX - zoomState.startX;
    zoomState.translateY = e.clientY - zoomState.startY;
    updateImageTransform();
  }
});

document.addEventListener('mouseup', () => {
  zoomState.isDragging = false;
  if (wrapper && zoomState.scale <= 1.01) {
    wrapper.style.cursor = 'zoom-in';  // Default cursor when not zoomed
  } else {
    wrapper.style.cursor = 'grab';
  }
});

// Touch support for mobile
let lastTouchDistance = 0;

wrapper.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1 && zoomState.scale > 1.01) {
    zoomState.isDragging = true;
    zoomState.startX = e.touches[0].clientX - zoomState.translateX;
    zoomState.startY = e.touches[0].clientY - zoomState.translateY;
  } else if (e.touches.length === 2) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    lastTouchDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
  }
});

wrapper.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && zoomState.isDragging) {
    e.preventDefault();
    zoomState.translateX = e.touches[0].clientX - zoomState.startX;
    zoomState.translateY = e.touches[0].clientY - zoomState.startY;
    updateImageTransform();
  } else if (e.touches.length === 2) {
    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const currentDistance = Math.hypot(
      touch1.clientX - touch2.clientX,
      touch1.clientY - touch2.clientY
    );
    
    if (lastTouchDistance > 0) {
      const factor = currentDistance / lastTouchDistance;
      zoomImage(factor);  // ZOOM IN PLACE - no shifting
    }
    
    lastTouchDistance = currentDistance;
  }
});

wrapper.addEventListener('touchend', () => {
  zoomState.isDragging = false;
  lastTouchDistance = 0;
});

// Set default cursor
wrapper.style.cursor = 'zoom-in';


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
