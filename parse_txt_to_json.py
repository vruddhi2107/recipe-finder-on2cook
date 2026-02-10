import os
import json
import re
import requests
from pathlib import Path

# ===============================
# CONFIG
# ===============================
EXTRACT_ROOT = "updated_extracted"
IMAGE_DIR = "test_images"
POPUP_DIR = "test_popup_images"
OUTPUT_JSON = "recipes_test.json"

SMARTSHEET_TOKEN = "7xcmOm3neR6SXBXda7fY9qis3Bg9z9VsBZ6T6"
SMARTSHEET_SHEET_ID = "7220178429366148"

SMARTSHEET_HEADERS = {
    "Authorization": f"Bearer {SMARTSHEET_TOKEN}",
    "Content-Type": "application/json"
}

# ===============================
# HELPERS
# ===============================

def safe_int(val, default=0):
    try:
        return int(val)
    except:
        return default


def clean_line(text):
    return text.replace(":", "").replace("-", "").strip()


def normalize_minutes(text):
    text = text.upper().strip()
    match = re.search(r"(\d+)", text)
    if not match:
        return ""
    return f"{match.group(1)} mins"


# ===============================
# SMARTSHEET LOGIC
# ===============================

def load_smartsheet_data():
    """
    Loads Smartsheet once and creates a lookup:
    {
        "BESAN TURAI": {
            "Veg/Non Veg": "...",
            "Cooking Mode": "...",
            "Cuisine": "...",
            "Category": "..."
        }
    }
    """
    print("📡 Fetching Smartsheet data...")

    url = f"https://api.smartsheet.com/2.0/sheets/{SMARTSHEET_SHEET_ID}"
    response = requests.get(url, headers=SMARTSHEET_HEADERS)

    if response.status_code != 200:
        raise Exception(f"Smartsheet API error: {response.status_code} - {response.text}")

    sheet = response.json()

    # Map columnId → columnTitle
    column_map = {}
    for col in sheet["columns"]:
        column_map[col["id"]] = col["title"]

    lookup = {}

    for row in sheet["rows"]:
        row_data = {}
        recipe_name = None

        for cell in row["cells"]:
            col_name = column_map.get(cell["columnId"])
            value = cell.get("value", "")

            if col_name == "Recipe Name":
                recipe_name = str(value).strip().upper()
            elif col_name in ["Veg/Non Veg", "Cooking Mode", "Cuisine", "Category"]:
                row_data[col_name] = str(value).strip().upper()

        if recipe_name:
            lookup[recipe_name] = row_data

    print(f" Loaded {len(lookup)} recipes from Smartsheet")
    return lookup


# ===============================
# TXT PARSER
# ===============================

def parse_recipe_txt(txt_path):
    with open(txt_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    recipe_name = data.get("name", [""])[0].strip().upper()
    original_name = recipe_name  # Keep original name for file naming

    ingredients = [ing.get("app_audio", "").strip() for ing in data.get("Ingredients", [])]

    total_on2cook_time_sec = sum(safe_int(step.get("durationInSec", 0)) for step in data.get("Instruction", []))
    total_on2cook_time_min = max(1, round(total_on2cook_time_sec / 60))

    description = data.get("description", "")
    desc_upper = description.upper()

    # -----------------------------
    # Conditional Recipe Name Extraction
    # -----------------------------
    # Check if description starts with recipe name (not metadata keywords)
    if description.strip():
        first_line = description.strip().split("\n")[0].strip().upper()
        metadata_keywords = ["NORMAL COOKING TIME", "NORMAL TIME", "FINAL OUTPUT", "OUTPUT", "ACCESSORIES"]
        
        # If first line doesn't start with any metadata keyword, use it as recipe name
        if first_line and not any(first_line.startswith(keyword) for keyword in metadata_keywords):
            recipe_name = first_line
            print(f"📝 Using recipe name from description: {recipe_name}")

    # -----------------------------
    # Final Output (check both "FINAL OUTPUT" and "OUTPUT")
    # -----------------------------
    total_output = ""
    if "FINAL OUTPUT" in desc_upper:
        try:
            total_output = clean_line(desc_upper.split("FINAL OUTPUT")[1].split("\n")[0])
        except:
            pass
    elif "OUTPUT" in desc_upper:
        try:
            total_output = clean_line(desc_upper.split("OUTPUT")[1].split("\n")[0])
        except:
            pass

    # -----------------------------
    # Accessories (each line = one accessory, stop at multiple keywords)
    # -----------------------------
    accessories = ""
    if "ACCESSORIES" in description.upper():
        try:
            # Take everything after ACCESSORIES
            part = description.split("ACCESSORIES", 1)[1]

            acc_list = []

            for line in part.splitlines():
                line = line.strip()
                if not line:
                    continue

                upper = line.upper()

                # Stop if anyof these sections begin
                stop_keywords = [
                    "FINAL OUTPUT",
                    "OUTPUT",
                    "NORMAL COOKING TIME",
                    "NORMAL TIME",
                    "OTHER ESSENTIALS",
                    "INGREDIENTS",
                    "NOTE",
                    "SPECIAL INSTRUCTION",
                    "SOUP STOCK 200 G",
                    "SIEVE & GARNISH",
                    "SHREDDED CHICKEN 100 G",
                    "RINSE POHA ONCE",
                    "KEEP IN STRAINER FOR 5 MINUTES",
                    "ACCESSORIES",
                    "STIR FRY CLEAR SAUCE",
                    "STIRRER NOT REQUIRED"
                ]
                
                if any(keyword in upper for keyword in stop_keywords):
                    break

                # Normalize: "COATED PAN" -> "Coated Pan"
                acc_list.append(line.title())

            accessories = ", ".join(acc_list)

        except Exception as e:
            print("❌ Accessories parse error:", e)

    # -----------------------------
    # Normal Cooking Time (check both "NORMAL COOKING TIME" and "NORMAL TIME")
    # -----------------------------
    normal_cooking_time = ""
    if "NORMAL COOKING TIME" in desc_upper:
        try:
            raw = clean_line(desc_upper.split("NORMAL COOKING TIME")[1].split("\n")[0])
            normal_cooking_time = normalize_minutes(raw)
        except:
            pass
    elif "NORMAL TIME" in desc_upper:
        try:
            raw = clean_line(desc_upper.split("NORMAL TIME")[1].split("\n")[0])
            normal_cooking_time = normalize_minutes(raw)
        except:
            pass

    recipe = {
        "Recipe Name": recipe_name,
        "Veg/Non Veg": "VEG",
        "Cooking Mode": "AUTO",
        "Cuisine": "GLOBAL CUISINE",
        "Category": "MAIN COURSE",
        "Cooking Time": total_on2cook_time_min,
        "Image": "",
        "PopupImage": "",
        "Ingredients": ingredients,
        "Accessories": accessories,
        "Total Output": total_output,
        "On2Cook Cooking Time": f"{total_on2cook_time_min}",
        "Normal Cooking Time": normal_cooking_time,
        "_original_name": original_name  # Internal field for file naming
    }

    return recipe

def format_accessory_name(name):
    name = name.strip().upper()

    mapping = {
        "COATED PAN": "Pan Coated (ceramic)",
        "SILICONE STIRRER": "Silicone Stirrer"
    }

    # If predefined mapping exists, use it
    if name in mapping:
        return mapping[name]

    # Otherwise do smart title case
    return name.title()

# ===============================
# MAIN GENERATOR
# ===============================

def generate_recipes_json():
    recipes = []
    Path(POPUP_DIR).mkdir(exist_ok=True)

    smartsheet_map = load_smartsheet_data()

    for recipe_key in os.listdir(EXTRACT_ROOT):
        recipe_dir = os.path.join(EXTRACT_ROOT, recipe_key)
        if not os.path.isdir(recipe_dir):
            continue

        txt_file = next((f for f in os.listdir(recipe_dir) if f.lower().endswith(".txt")), None)
        if not txt_file:
            print(f"⚠ No TXT file in {recipe_key}")
            continue

        recipe = parse_recipe_txt(os.path.join(recipe_dir, txt_file))
        name = recipe["Recipe Name"]
        original_name = recipe.get("_original_name", name)  # Use original name for file naming

        # 🔥 Smartsheet override logic
        if name in smartsheet_map:
            ss = smartsheet_map[name]
            for field in ["Veg/Non Veg", "Cooking Mode", "Cuisine", "Category"]:
                old = recipe[field]
                new = ss.get(field, old)
                if new and new != old:
                    recipe[field] = new
                    print(f"🔄 {name} → {field}: {old} → {new}")
        else:
            print(f"⚠ {name} not found in Smartsheet")

        # Use original_name for file naming to keep filenames consistent
        popup_name = original_name.replace("/", "_").replace("\\", "_")

        recipe["Image"] = f"{IMAGE_DIR}/{recipe_key}.jpg"
        recipe["PopupImage"] = f"{POPUP_DIR}/{popup_name}.pdf"
        
        # Remove internal field before saving to JSON
        recipe.pop("_original_name", None)

        recipes.append(recipe)
        print(f"🍽 Parsed: {name}")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)

    print(f"\n✅ {len(recipes)} recipes written to {OUTPUT_JSON}")
    print("📡 Smartsheet is now the master for:")
    print("   - Veg/Non Veg")
    print("   - Cooking Mode")
    print("   - Cuisine")
    print("   - Category")


if __name__ == "__main__":
    generate_recipes_json()