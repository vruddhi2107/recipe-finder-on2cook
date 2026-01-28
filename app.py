import os
import requests
import zipfile
from datetime import datetime
from flask import Flask, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
import requests
import os
import zipfile

def download_missing_zips():
    token = os.getenv('SMARTSHEET_TOKEN')
    sheet_id = os.getenv('SHEET_ID', '7220178429366148')
    
    if not token:
        print("⚠️ No token")
        return 0
    
    os.makedirs("zips", exist_ok=True)
    
    # Step 1: Get sheet to find ZIP attachments
    sheet_url = f"https://api.smartsheet.com/2.0/sheets/{sheet_id}?include=attachments"
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = requests.get(sheet_url, headers=headers)
    sheet = resp.json()
    print(f"✅ {len(sheet['rows'])} rows found")
    
    downloaded = 0
    for row in sheet['rows']:
        recipe_name = row['cells'][0]['displayValue'].replace(" ", "-").replace("/", "-").upper()
        zip_path = f"zips/{recipe_name}.zip"
        
        # Skip existing
        if os.path.exists(zip_path):
            print(f"⏭️ {recipe_name} exists")
            continue
        
        # Step 2: Find ZIP attachment ID
        for att in row.get('attachments', []):
            if att['name'].lower().endswith('.zip'):
                print(f"📦 Downloading {recipe_name}")
                
                # 🔥 DIRECT DOWNLOAD - NO URL NEEDED
                direct_url = f"https://api.smartsheet.com/2.0/sheets/{sheet_id}/attachments/{att['id']}/download"
                
                try:
                    zip_resp = requests.get(
                        direct_url, 
                        headers=headers,
                        stream=True, 
                        timeout=60
                    )
                    zip_resp.raise_for_status()
                    
                    with open(zip_path, 'wb') as f:
                        for chunk in zip_resp.iter_content(8192):
                            f.write(chunk)
                    
                    if zipfile.is_zipfile(zip_path):
                        size = os.path.getsize(zip_path) / 1024
                        print(f"✅ {recipe_name}.zip ({size:.1f}KB)")
                        downloaded += 1
                        break
                    else:
                        os.remove(zip_path)
                        
                except Exception as e:
                    print(f"❌ {recipe_name}: {e}")
                    if os.path.exists(zip_path):
                        os.remove(zip_path)
    
    print(f"✅ Downloaded {downloaded} ZIPs directly")
    return downloaded



def run_refresh_pipeline():
    print(f"🔄 START: {datetime.now()}")
    
    try:
        new_zips = download_missing_zips()
        from extract_and_update_images import update_images_from_zips
        from update_json import update_recipes_json
        
        total_zips = len([f for f in os.listdir("zips") if f.endswith('.zip')])
        
        stats = {
            "new_smartsheet": new_zips,
            "total_zips": total_zips,
            "images": update_images_from_zips(),
            "recipes": update_recipes_json()
        }
        return True, stats
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, {"error": str(e)}

# Routes...
@app.route('/refresh-recipes', methods=['POST'])
def refresh_endpoint():
    success, stats = run_refresh_pipeline()
    return jsonify({"success": success, "stats": stats})

@app.route('/recipes.json')
def serve_recipes():
    return send_file('recipes_final.json', mimetype='application/json') if os.path.exists('recipes_final.json') else jsonify([])

@app.route('/')
def home():
    return """
    <h1>🔥 365 Recipe Downloader</h1>
    <button onclick="refresh()">📥 Get All Recipes</button>
    <pre id="status">Ready</pre>
    <script>
    async function refresh() {
        document.getElementById('status').textContent = 'Downloading...';
        const res = await fetch('/refresh-recipes', {method: 'POST'});
        const data = await res.json();
        document.getElementById('status').textContent = JSON.stringify(data.stats, null, 2);
    }
    </script>
    """

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
