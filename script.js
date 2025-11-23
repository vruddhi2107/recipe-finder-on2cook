
let recipes = []; // Global recipes array

// DOM Elements
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

const popupModal = document.getElementById('popupModal');
const popupImage = document.getElementById('popupImage');
const popupCloseBtn = document.getElementById('popupCloseBtn');

// Fetch recipes JSON file asynchronously and initialize the app
function loadRecipes() {
  fetch('recipes_updated.json')
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

// Populate filter dropdowns dynamically
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

  populateSelect(dietType, getUniqueValues('Veg/Non Veg'));
  populateSelect(cookingMode, getUniqueValues('Cooking Mode'));
  populateSelect(cuisine, getUniqueValues('Cuisine'));
  populateSelect(category, getUniqueValues('Category'));
  populateSelect(accessory, getUniqueValues('Accessories'));
}

// Filter recipes based on search term and filters
function filterRecipes() {
  const searchTerm = searchBar.value.toLowerCase().trim();
  return recipes.filter(r => {
    const matchesSearch = searchTerm === '' || r['Recipe Name'].toLowerCase().includes(searchTerm);
    return matchesSearch &&
           (dietType.value === 'All' || r['Veg/Non Veg'] === dietType.value) &&
           (cookingMode.value === 'All' || r['Cooking Mode'] === cookingMode.value) &&
           (cuisine.value === 'All' || r['Cuisine'] === cuisine.value) &&
           (category.value === 'All' || r['Category'] === category.value) &&
           (accessory.value === 'All' || (r['Accessories'] && r['Accessories'].split(',').map(a => a.trim()).includes(accessory.value))) &&
           (r['Cooking Time'] <= parseInt(cookingTime.value));
  });
}

// Display the filtered recipes in the UI
function showRecipes() {
  recipesGrid.innerHTML = "";
  const filtered = filterRecipes();
  if (filtered.length === 0) {
    recipesGrid.innerHTML = "<p>No recipes found matching your filters.</p>";
    return;
  }
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
      <div class="time-circle">${r['Cooking Time']}m</div>
      <img src="${r.Image}" alt="${r['Recipe Name']}" class="recipe-image" />
      <div class="recipe-title">${r['Recipe Name']}</div>
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

// Event listeners for filter inputs
dietType.addEventListener('change', showRecipes);
cookingMode.addEventListener('change', showRecipes);
cuisine.addEventListener('change', showRecipes);
category.addEventListener('change', showRecipes);
accessory.addEventListener('change', showRecipes);
cookingTime.addEventListener('input', () => {
  cookingTimeLabel.textContent = cookingTime.value;
  showRecipes();
});

// Clear filters button
clearBtn.addEventListener('click', () => {
  dietType.value = 'All';
  cookingMode.value = 'All';
  cuisine.value = 'All';
  category.value = 'All';
  accessory.value = 'All';
  cookingTime.value = 20;
  cookingTimeLabel.textContent = '20';
  searchBar.value = '';
  showRecipes();
});

// Debounce function to optimize input handling
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Add search input event listener with debounce for filtering while typing
const debouncedShowRecipes = debounce(showRecipes, 300);
searchBar.addEventListener('input', debouncedShowRecipes);

// Initialize app on window load
window.addEventListener('load', () => {
  loadRecipes();
});
document.getElementById('dontKnowBar').addEventListener('click', () => {
  window.location.href = 'ingredient_input.html';
});
