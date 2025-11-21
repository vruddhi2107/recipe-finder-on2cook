// let recipes = [];
// let defaultLoaded = false;

// // Load default Excel file from project folder on page load
// function loadDefaultExcel() {
//     fetch('On2Cook Kitchen Recipes Master.xlsx').then(res => res.arrayBuffer()).then(data => {
//         const workbook = XLSX.read(data, { type: 'array' });
//         const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//         recipes = XLSX.utils.sheet_to_json(firstSheet);
//         defaultLoaded = true;
//         buildFilters();
//         showRecipes();
//     }).catch(() => {
//         // Fallback demo data if Excel can't be loaded
//         recipes = [
//             {
//                 "Recipe Name": "QUINOA BOILED",
//                 "Veg/Non Veg": "Veg",
//                 "Cooking Mode": "Boiling",
//                 "Cuisine": "Continental",
//                 "Category": "Main Course",
//                 "Cooking Time": 20,
//                 "Accessories": "Pot"
//             },
//             {
//                 "Recipe Name": "TOMATO GRAVY",
//                 "Veg/Non Veg": "Veg",
//                 "Cooking Mode": "Sauteing",
//                 "Cuisine": "Indian",
//                 "Category": "Base Gravy",
//                 "Cooking Time": 18,
//                 "Accessories": "Pan"
//             }
//         ];
//         buildFilters();
//         showRecipes();
//     });
// }

// // Listen file upload to override data
// document.getElementById('fileInput').addEventListener('change', e => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = e => {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });
//         const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//         recipes = XLSX.utils.sheet_to_json(firstSheet);
//         buildFilters();
//         showRecipes();
//     };
//     reader.readAsArrayBuffer(file);
// });

// function getUnique(arr, key) {
//     const set = new Set();
//     arr.forEach(o => {
//         if (o[key]) {
//             o[key].toString().split(',').forEach(v => set.add(v.trim()));
//         }
//     });
//     return Array.from(set).sort();
// }

// function buildFilters() {
//     // Populate dropdowns dynamically
//     const dietSel = document.getElementById('dietType');
//     dietSel.innerHTML = '<option value="All">All</option>';
//     getUnique(recipes, 'Veg/Non Veg').forEach(v => dietSel.innerHTML += `<option value="${v}">${v}</option>`);

//     const modeSel = document.getElementById('cookingMode');
//     modeSel.innerHTML = '<option value="All">All</option>';
//     getUnique(recipes, 'Cooking Mode').forEach(v => modeSel.innerHTML += `<option value="${v}">${v}</option>`);

//     const cuisineSel = document.getElementById('cuisine');
//     cuisineSel.innerHTML = '<option value="All">All</option>';
//     getUnique(recipes, 'Cuisine').forEach(v => cuisineSel.innerHTML += `<option value="${v}">${v}</option>`);

//     const categorySel = document.getElementById('category');
//     categorySel.innerHTML = '<option value="All">All</option>';
//     getUnique(recipes, 'Category').forEach(v => categorySel.innerHTML += `<option value="${v}">${v}</option>`);

//     const accessorySel = document.getElementById('accessory');
//     accessorySel.innerHTML = '<option value="">All Accessories</option>';
//     getUnique(recipes, 'Accessories').forEach(v => accessorySel.innerHTML += `<option value="${v}">${v}</option>`);
// }

// function filterRecipes() {
//     const diet = document.getElementById('dietType').value;
//     const mode = document.getElementById('cookingMode').value;
//     const cuisine = document.getElementById('cuisine').value;
//     const category = document.getElementById('category').value;
//     const maxTime = parseInt(document.getElementById('cookingTime').value);
//     const accessory = document.getElementById('accessory').value;

//     return recipes.filter(r =>
//         (diet === 'All' || r['Veg/Non Veg'] === diet) &&
//         (mode === 'All' || r['Cooking Mode'] === mode) &&
//         (cuisine === 'All' || r['Cuisine'] === cuisine) &&
//         (category === 'All' || r['Category'] === category) &&
//         (!accessory || (r['Accessories'] && r['Accessories'].split(',').map(a => a.trim()).includes(accessory))) &&
//         (parseInt(r['Cooking Time']) <= maxTime)
//     );
// }
// function showRecipes() {
//   const container = document.getElementById('recipesGrid');
//   container.innerHTML = '';
//   const filtered = filterRecipes();
//   if (filtered.length === 0) {
//     container.innerHTML = '<p>No recipes found matching your filters.</p>';
//     return;
//   }
//   filtered.forEach(r => {
//     // Clean the image URL by removing any trailing quotes or encoded quotes
//     let imageUrl = '';
//     if (r['Image']) {
//       imageUrl = r['Image'].trim().replace(/["'%22%27]+$/g, '');
//     }
    
//     const vegNonVeg = (r['Veg/Non Veg'] || '').toString().trim().toLowerCase();
//     const dietClass = vegNonVeg === 'veg' ? 'veg' : 'nonveg';
    
//     container.innerHTML += `
//       <div class="recipe-card">
//         ${imageUrl ? `<img src="${imageUrl}" class="recipe-image" alt="${r['Recipe Name']}" onerror="this.style.display='none'" />` : ''}
//         <div class="top-indicators">
//           <div class="diet-indicator ${dietClass}">
//             <div class="inner-dot"></div>
//           </div>
//           <div class="time-circle">${r['Cooking Time']} m</div>
//         </div>
//         <div class="recipe-title">${r['Recipe Name']}</div>
//         <div class="recipe-meta">${r['Veg/Non Veg']} | ${r['Cooking Mode']} | ${r['Cuisine']}</div>
//         <div class="recipe-category">${r['Category']}</div>
//         ${r['Accessories'] ? `<div class="recipe-accessory">Accessory: ${r['Accessories']}</div>` : ''}
//       </div>
//     `;
//   });
// }


// // Event handlers for filters and clear button
// ['dietType', 'cookingMode', 'cuisine', 'category', 'cookingTime', 'accessory'].forEach(id => {
//     document.getElementById(id).addEventListener('change', showRecipes);
// });

// document.getElementById('cookingTime').addEventListener('input', e => {
//     document.getElementById('cookingTimeLabel').textContent = e.target.value + ' min';
//     showRecipes();
// });

// document.getElementById('clearBtn').addEventListener('click', () => {
//     document.getElementById('dietType').value = 'All';
//     document.getElementById('cookingMode').value = 'All';
//     document.getElementById('cuisine').value = 'All';
//     document.getElementById('category').value = 'All';
//     document.getElementById('accessory').value = '';
//     document.getElementById('cookingTime').value = 20;
//     document.getElementById('cookingTimeLabel').textContent = '20 min';
//     showRecipes();
// });

// // Load default Excel data on page load
// window.onload = loadDefaultExcel;

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
