import smartsheet, json, zipfile, os, shutil
import tempfile
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Dynamic - works on Render, Windows, Linux
TOKEN = os.getenv('SMARTSHEET_TOKEN', 'your_smartsheet_token_here')
SHEET_ID = os.getenv('SHEET_ID', 'your_sheet_id_here')

smartsheet_client = smartsheet.Smartsheet(TOKEN)

def process_one_recipe(row):
    print(f"🔍 Processing recipe for row {row.id}")
    
    # Dynamic recipe name (first column)
    try:
        name = row.cells[0].display_value.replace(" ", "-").upper().strip()
    except:
        print("❌ No recipe name found")
        return None
    
    if not name:
        print("❌ Empty recipe name")
        return None
        
    # Create dynamic temp directory
    temp_dir = tempfile.mkdtemp(prefix="recipe_")
    zip_path = os.path.join(temp_dir, f"{name}.zip")
    
    try:
        # Get attachments for THIS ROW (fixed method)
        attachments_result = smartsheet_client.Attachments.list_attachments_for_row(
            row.sheet_id, row.id
        )
        attachments = attachments_result.data
        
        zip_attach = next((a for a in attachments if a.file_type == "ZIP"), None)
        if not zip_attach:
            print(f"❌ No ZIP attachment found for {name}")
            return None
        
        print(f"📦 Found ZIP: {zip_attach.name}")
        
        # Download ZIP correctly
        with open(zip_path, 'wb') as f:
            attachment_url = f"https://api.smartsheet.com/2.0/sheets/{row.sheet_id}/attachments/{zip_attach.id}"
            response = smartsheet_client.Session().get(attachment_url)
            f.write(response.content)
        
        # Extract files
        extract_path = os.path.join(temp_dir, "extract")
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as z:
            z.extractall(extract_path)
        
        # Find and copy JPG
        os.makedirs("images", exist_ok=True)
        jpg_found = False
        for file in os.listdir(extract_path):
            if file.lower().endswith('.jpg'):
                src = os.path.join(extract_path, file)
                dst = f"images/{name}.jpg"
                shutil.copy2(src, dst)
                print(f"🖼️  Copied image: {dst}")
                jpg_found = True
        
        if not jpg_found:
            print("❌ No JPG found in ZIP")
            return None
        
        # Find and read TXT/JSON
        txt_data = None
        for file in os.listdir(extract_path):
            if file.lower().endswith('.txt'):
                txt_path = os.path.join(extract_path, file)
                try:
                    with open(txt_path, 'r', encoding='utf-8') as f:
                        txt_data = json.load(f)
                    print(f"📄 Loaded recipe data from: {file}")
                    break
                except Exception as e:
                    print(f"❌ Error reading {file}: {e}")
        
        if not txt_data:
            print("❌ No valid TXT/JSON found")
            # Create basic recipe even without txt
            recipe = create_basic_recipe(name)
        else:
            recipe = create_dynamic_recipe(name, txt_data)
        
        # Create dummy popup image path (add your CLI later)
        os.makedirs("popup_images", exist_ok=True)
        recipe["PopupImage"] = f"popup_images/{name}.png"
        
        print(f"✅ Created recipe: {name}")
        return recipe
        
    except Exception as e:
        print(f"❌ Error processing {name}: {str(e)}")
        return None
    finally:
        # Always cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)

def create_dynamic_recipe(name, data):
    """Extract real data from TXT file"""
    ingredients = []
    if data.get('Ingredients'):
        for i, ing in enumerate(data['Ingredients'][:3], 1):  # First 3 ingredients
            title = ing.get('title', '').strip()
            weight = ing.get('weight', '').strip()
            ingredients.append(f"{title} {weight}".strip())
    
    # Calculate cooking time from instructions
    total_seconds = 0
    if data.get('Instruction'):
        for instr in data['Instruction']:
            total_seconds += instr.get('durationInSec', 0)
    cooking_time = max(20, total_seconds // 60)
    
    return {
        "Recipe Name": name,
        "Veg/Non Veg": "VEG",
        "Cooking Mode": "AUTO",
        "Cuisine": data.get('tags', 'GLOBAL CUISINE'),
        "Category": data.get('category', 'MAIN COURSE'),
        "Cooking Time": cooking_time,
        "Image": f"images/{name}.jpg",
        "PopupImage": f"popup_images/{name}.png",
        "Ingredients": ingredients if ingredients else ["Ingredients not found"],
        "Accessories": "Pan Coated (ceramic), Silicone Stirrer",
        "Total Output": data.get('description', '1000g').split()[-1] if data.get('description') else "1000g",
        "On2Cook Cooking Time": f"{cooking_time}:00",
        "Normal Cooking Time": f"{cooking_time + 10} mins."
    }

def create_basic_recipe(name):
    """Fallback if no TXT data"""
    return {
        "Recipe Name": name,
        "Veg/Non Veg": "VEG",
        "Cooking Mode": "AUTO",
        "Cuisine": "GLOBAL CUISINE",
        "Category": "MAIN COURSE",
        "Cooking Time": 20,
        "Image": f"images/{name}.jpg",
        "PopupImage": f"popup_images/{name}.png",
        "Ingredients": ["Check Smartsheet row for ingredients"],
        "Accessories": "Pan Coated (ceramic), Silicone Stirrer",
        "Total Output": "1000g",
        "On2Cook Cooking Time": "20:00",
        "Normal Cooking Time": "30 mins."
    }

@app.route("/webhook", methods=["POST", "GET"])
def webhook():
    if request.method == "GET":
        # Smartsheet challenge verification
        challenge = request.args.get('challenge')
        if challenge:
            return challenge
    
    try:
        # Handle webhook payload
        data = request.get_json()
        print(f"📨 Webhook received: {data}")
        
        if not data or 'scopeObject' not in data:
            return jsonify({"status": "no scopeObject"}), 200
        
        scope = data['scopeObject']
        if scope.get('eventType') not in ['rowAdded', 'rowUpdated']:
            print("ℹ️ Ignoring event:", scope.get('eventType'))
            return jsonify({"status": "ignored"}), 200
        
        row_id = scope['objectId']
        print(f"🔄 Processing row ID: {row_id}")
        
        # Get specific row
        row = smartsheet_client.Rows.get_row(SHEET_ID, row_id)
        recipe = process_one_recipe(row)
        
        if not recipe:
            print("❌ Failed to process recipe")
            return jsonify({"status": "failed"}), 200
        
        # Update recipes.json ATOMICALLY
        recipes = []
        json_path = 'test.json'
        try:
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    recipes = json.load(f)
        except:
            recipes = []
        
        # Remove old version, add new
        recipes = [r for r in recipes if r["Recipe Name"] != recipe["Recipe Name"]]
        recipes.append(recipe)
        
        # Write atomically
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(recipes, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved {recipe['Recipe Name']} to recipes.json")
        return jsonify({"status": "success", "recipe": recipe["Recipe Name"]})
        
    except Exception as e:
        print(f"❌ Webhook error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Serve your existing static website
@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head><title>Recipe Processor</title></head>
    <body>
        <h1>✅ Recipe Processor Running!</h1>
        <p>Webhook ready at: /webhook</p>
        <p>Your website files will be served from static folder</p>
    </body>
    </html>
    """

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
