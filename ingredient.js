let recipes = [];
let selectedIngredients = [];

// Fetch actual recipes JSON file
fetch('recipes_out.json')
  .then(response => response.json())
  .then(data => {
    recipes = data;
    renderSelectedIngredients();
    displayRecipes();
  })
  .catch(error => {
    const resultsDiv = document.getElementById('recipeResults');
    resultsDiv.innerHTML = "<p style='color:red'>Failed to load recipes.</p>";
  });

document.getElementById('addIngredientBtn').onclick = function() {
  const val = document.getElementById('ingredientInput').value.trim().toLowerCase();
  if (val && !selectedIngredients.includes(val)) {
    selectedIngredients.push(val);
    document.getElementById('ingredientInput').value = '';
    renderSelectedIngredients();
    displayRecipes();
  }
};

document.getElementById('ingredientInput').addEventListener('keydown', function(e){
  if(e.key === 'Enter') document.getElementById('addIngredientBtn').click();
});

document.getElementById('backBtn').onclick = function() {
  window.location.href = 'index.html';
};

function renderSelectedIngredients() {
  const tagsDiv = document.getElementById('ingredientTags');
  tagsDiv.innerHTML = '';
  selectedIngredients.forEach((ing, idx) => {
    const tag = document.createElement('span');
    tag.textContent = ing;
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.onclick = function() {
      selectedIngredients.splice(idx, 1);
      renderSelectedIngredients();
      displayRecipes();
    };
    tag.appendChild(btn);
    tagsDiv.appendChild(tag);
  });
}

function displayRecipes() {
  const resultsDiv = document.getElementById('recipeResults');
  const countDiv = document.getElementById('recipesCount');
  if (selectedIngredients.length === 0) {
    countDiv.textContent = "";
    resultsDiv.innerHTML = "";
    return;
  }

  // Filter recipes where EVERY selected ingredient is found (substring) in AT LEAST ONE item of the recipe's Ingredients array
  const filtered = recipes.filter(r => 
    Array.isArray(r.Ingredients) && selectedIngredients.every(ing =>
      r.Ingredients.some(recipeIng => recipeIng.toLowerCase().includes(ing.toLowerCase()))
    )
  );

  countDiv.textContent = filtered.length ? `${filtered.length} Recipes Found` : "No Recipes Found";
  resultsDiv.innerHTML = '';
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.innerHTML = `
      <img src="${r.Image}" alt="${r['Recipe Name']}" />
      <div>${r['Recipe Name']}</div>
      <div>
        <span>${r['Veg/Non Veg']}</span>&nbsp;
        <span>${r['Cooking Time']} min</span>
      </div>
      <div>${r['Category']} | ${r['Cooking Mode']} | ${r['Cuisine']}</div>
      <div>Ingredients: ${r.Ingredients.join(', ')}</div>
    `;
    card.addEventListener('click', function() {
      openPopup(r.PopupImage, r['Recipe Name']);
    });
    resultsDiv.appendChild(card);
  });
}

// Popup modal logic
function openPopup(imageSrc, altText) {
  const modal = document.getElementById('popupModal');
  const popupImg = document.getElementById('popupImage');
  popupImg.src = imageSrc;
  popupImg.alt = altText || 'Recipe Image';
  modal.classList.add('show');
}

document.getElementById('popupCloseBtn').onclick = function() {
  document.getElementById('popupModal').classList.remove('show');
};
document.getElementById('popupModal').onclick = function(e) {
  if(e.target === this) {
    document.getElementById('popupModal').classList.remove('show');
  }
};
