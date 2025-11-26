let recipes = []; // Global recipes array

// DOM Elements - Desktop
const dietType = document.getElementById('dietType');
const cookingMode = document.getElementById('cookingMode');
const cuisine = document.getElementById('cuisine');
const category = document.getElementById('category');
const cookingTime = document.getElementById('cookingTime');
const cookingTimeLabel = document.getElementById('cookingTimeLabel');
const accessory = document.getElementById('accessory');
const clearBtn = document.getElementById('clearBtn');
const recipesGrid = document.getElementById('recipesGrid');
const searchBar = document.getElementById('searchBar');

// DOM Elements - Mobile
const dietTypeMobile = document.getElementById('dietTypeMobile');
const cookingModeMobile = document.getElementById('cookingModeMobile');
const cuisineMobile = document.getElementById('cuisineMobile');
const categoryMobile = document.getElementById('categoryMobile');
const cookingTimeMobile = document.getElementById('cookingTimeMobile');
const cookingTimeLabelMobile = document.getElementById('cookingTimeLabelMobile');
const accessoryMobile = document.getElementById('accessoryMobile');
const clearBtnMobile = document.getElementById('clearBtnMobile');
const searchBarMobile = document.getElementById('searchBarMobile');

// Popup modal elements
const popupModal = document.getElementById('popupModal');
const popupImage = document.getElementById('popupImage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// Fetch recipes JSON file asynchronously and initialize the app
function loadRecipes() {
  fetch('recipes_out.json')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load recipes.json');
      return response.json();
    })
    .then(data => {
      recipes = data;
      populateFilters();
      showRecipes();
    })
    .catch(err => {
      console.error('Error loading recipes:', err);
      recipesGrid.innerHTML = "<p>Failed to load recipes.</p>";
    });
}

// Get unique sorted values for a filter key
function getUniqueValues(key) {
  const set = new Set(recipes.map(r => r[key]).filter(Boolean));
  return Array.from(set).sort();
}

function getUniqueAccessories() {
  const accessorySet = new Set();
  recipes.forEach(recipe => {
    if (recipe['Accessories']) {
      recipe['Accessories'].split(',').forEach(acc => accessorySet.add(acc.trim()));
    }
  });
  return Array.from(accessorySet).sort();
}

// Populate filter dropdowns dynamically on both desktop and mobile
function populateFilters() {
  const populateSelect = (select, items) => {
    select.innerHTML = '<option value="All">All</option>';
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.text = item;
      select.appendChild(option);
    });
  };

  // Populate desktop selects
  populateSelect(dietType, getUniqueValues('Veg/Non Veg'));
  populateSelect(cookingMode, getUniqueValues('Cooking Mode'));
  populateSelect(cuisine, getUniqueValues('Cuisine'));
  populateSelect(category, getUniqueValues('Category'));
  populateSelect(accessory, getUniqueAccessories());

  // Populate mobile selects
  populateSelect(dietTypeMobile, getUniqueValues('Veg/Non Veg'));
  populateSelect(cookingModeMobile, getUniqueValues('Cooking Mode'));
  populateSelect(cuisineMobile, getUniqueValues('Cuisine'));
  populateSelect(categoryMobile, getUniqueValues('Category'));
  populateSelect(accessoryMobile, getUniqueAccessories());
}

// Filter recipes based on search term and filters (common function)
function filterRecipes(filters) {
  const {
    searchTerm,
    dietVal,
    cookingModeVal,
    cuisineVal,
    categoryVal,
    accessoryVal,
    maxCookingTime
  } = filters;

  return recipes.filter(r => {
    const matchesSearch = searchTerm === '' || r['Recipe Name'].toLowerCase().includes(searchTerm);
    return matchesSearch &&
           (dietVal === 'All' || r['Veg/Non Veg'] === dietVal) &&
           (cookingModeVal === 'All' || r['Cooking Mode'] === cookingModeVal) &&
           (cuisineVal === 'All' || r['Cuisine'] === cuisineVal) &&
           (categoryVal === 'All' || r['Category'] === categoryVal) &&
           (accessoryVal === 'All' || (r['Accessories'] && r['Accessories'].split(',').map(a => a.trim()).includes(accessoryVal))) &&
           (r['On2Cook Cooking Time'] && parseInt(r['On2Cook Cooking Time'], 10) <= maxCookingTime);
  });
}


// Show recipes based on desktop filters
function showRecipes() {
  const filters = {
    searchTerm: searchBar.value.toLowerCase().trim(),
    dietVal: dietType.value,
    cookingModeVal: cookingMode.value,
    cuisineVal: cuisine.value,
    categoryVal: category.value,
    accessoryVal: accessory.value,
    maxCookingTime: parseInt(cookingTime.value)
  };
  displayFilteredRecipes(filters);
}

// Show recipes based on mobile filters and close mobile modal
function showRecipesMobile() {
  const filters = {
    searchTerm: searchBarMobile.value.toLowerCase().trim(),
    dietVal: dietTypeMobile.value,
    cookingModeVal: cookingModeMobile.value,
    cuisineVal: cuisineMobile.value,
    categoryVal: categoryMobile.value,
    accessoryVal: accessoryMobile.value,
    maxCookingTime: parseInt(cookingTimeMobile.value)
  };
  displayFilteredRecipes(filters);
  // Close mobile modal if open
  document.getElementById('mobileFilterModal').classList.remove('active');
  // Sync filter values to desktop for consistency
  syncMobileToDesktopFilters();
}

// Display filtered recipes UI
function displayFilteredRecipes(filters) {
  const filtered = filterRecipes(filters);
  recipesGrid.innerHTML = "";
  document.getElementById('recipeCount').textContent = `${filtered.length} recipes found`;
filtered.sort((a, b) => {
    // Parse cooking times as numbers to avoid string comparison issues
    const timeA = parseInt(a['On2Cook Cooking Time'], 10) || 0;
    const timeB = parseInt(b['On2Cook Cooking Time'], 10) || 0;
    return timeA - timeB; // For descending order
  });

  if (filtered.length === 0) {
    recipesGrid.innerHTML = "<p>No recipes found matching your filters.</p>";
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement('div');
    let cleanTime = r['Normal Cooking Time']?.replace(/[ .,;:!?'"()-]/g, "") || "";
    card.className = 'recipe-card';
    card.innerHTML = `
      <img src="${r.Image}" alt="${r['Recipe Name']}" class="recipe-image" />
      <div class="recipe-title">
        ${r['Recipe Name']}
        <div class="recipe-info"> 
         <span class="diet-icon ${r['Veg/Non Veg'] === 'VEG' ? 'veg' : 'non-veg'}"></span>
         <div class="time-circle">${r['Total Output']}</div>
        </div>
      </div>
      <div class="badge-row">
        <div class="badge on2cook">
          <span class="badge-icon">⏱</span>
          <span class="badge-content">
            <span class="badge-label">On2Cook</span>
            <span class="badge-time">${r['On2Cook Cooking Time']} min</span>
          </span>
        </div>
        <div class="badge normal">
          <span class="badge-icon">⏱</span>
          <span class="badge-content">
            <span class="badge-label">Normal</span>
            <span class="badge-time">${cleanTime}</span>
          </span>
        </div>
      </div>
      <div class="recipe-meta">${r['Veg/Non Veg']} | ${r['Cooking Mode']} | ${r['Cuisine']}</div>
      <div class="recipe-category">${r['Category']}</div>
      ${r['Accessories'] ? `<div class="recipe-accessory">Accessory: ${r['Accessories']}</div>` : ''}
    `;

    card.addEventListener('click', () => {
      openPopup(r.PopupImage, r['Recipe Name']);
    });
    recipesGrid.appendChild(card);
  });
}

// Popup image display
function openPopup(src, alt) {
  popupImage.src = src;
  popupImage.alt = alt || 'Recipe Image';
  popupModal.style.display = 'flex';
}

popupCloseBtn.addEventListener('click', () => {
  popupModal.style.display = 'none';
});

popupModal.addEventListener('click', e => {
  if (e.target === popupModal) {
    popupModal.style.display = 'none';
  }
});

// Event listeners for desktop filter inputs
dietType.addEventListener('change', showRecipes);
cookingMode.addEventListener('change', showRecipes);
cuisine.addEventListener('change', showRecipes);
category.addEventListener('change', showRecipes);
accessory.addEventListener('change', showRecipes);
cookingTime.addEventListener('input', () => {
  cookingTimeLabel.textContent = cookingTime.value;
  showRecipes();
});
searchBar.addEventListener('input', debounce(showRecipes, 300));

// Event listeners for mobile filter inputs
dietTypeMobile.addEventListener('change', showRecipesMobile);
cookingModeMobile.addEventListener('change', showRecipesMobile);
cuisineMobile.addEventListener('change', showRecipesMobile);
categoryMobile.addEventListener('change', showRecipesMobile);
accessoryMobile.addEventListener('change', showRecipesMobile);
cookingTimeMobile.addEventListener('input', () => {
  cookingTimeLabelMobile.textContent = cookingTimeMobile.value;
  showRecipesMobile();
});
searchBarMobile.addEventListener('input', debounce(showRecipesMobile, 300));

// Clear filters button - desktop
clearBtn.addEventListener('click', () => {
  dietType.value = 'All';
  cookingMode.value = 'All';
  cuisine.value = 'All';
  category.value = 'All';
  accessory.value = 'All';
  cookingTime.value = 35;
  cookingTimeLabel.textContent = '35';
  searchBar.value = '';
  showRecipes();
  // Also sync to mobile
  syncDesktopToMobileFilters();
});

// Clear filters button - mobile
clearBtnMobile.addEventListener('click', () => {
  dietTypeMobile.value = 'All';
  cookingModeMobile.value = 'All';
  cuisineMobile.value = 'All';
  categoryMobile.value = 'All';
  accessoryMobile.value = 'All';
  cookingTimeMobile.value = 35;
  cookingTimeLabelMobile.textContent = '35';
  searchBarMobile.value = '';
  showRecipesMobile();
});

// Debounce function to optimize input handling
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Sync desktop filter values to mobile filters
function syncDesktopToMobileFilters() {
  dietTypeMobile.value = dietType.value;
  cookingModeMobile.value = cookingMode.value;
  cuisineMobile.value = cuisine.value;
  categoryMobile.value = category.value;
  accessoryMobile.value = accessory.value;
  cookingTimeMobile.value = cookingTime.value;
  cookingTimeLabelMobile.textContent = cookingTime.value;
  searchBarMobile.value = searchBar.value;
}

// Sync mobile filter values to desktop filters
function syncMobileToDesktopFilters() {
  dietType.value = dietTypeMobile.value;
  cookingMode.value = cookingModeMobile.value;
  cuisine.value = cuisineMobile.value;
  category.value = categoryMobile.value;
  accessory.value = accessoryMobile.value;
  cookingTime.value = cookingTimeMobile.value;
  cookingTimeLabel.textContent = cookingTimeMobile.value;
  searchBar.value = searchBarMobile.value;
}

// Initialize app on window load
window.addEventListener('load', () => {
  loadRecipes();
});

// Optional: Don't know what to cook bar redirect
document.getElementById('dontKnowBar').addEventListener('click', () => {
  window.location.href = 'ingredient_input.html';
});
dietTypeMobile.addEventListener('change', () => {
  console.log('dietTypeMobile changed:', dietTypeMobile.value);
  showRecipesMobile();
});
mobileFilterBtn.addEventListener('click', () => {
  mobileFilterModal.classList.add('active'); // Show the modal
});

closeMobileFilter.addEventListener('click', () => {
  mobileFilterModal.classList.remove('active'); // Hide the modal
});

// Also close the modal when clicking outside the modal content area
mobileFilterModal.addEventListener('click', (event) => {
  if (event.target === mobileFilterModal) {
    mobileFilterModal.classList.remove('active');
  }
});
