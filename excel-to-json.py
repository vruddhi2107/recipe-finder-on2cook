import pandas as pd
import json

def excel_to_json(input_file, output_file):
    """
    Convert Excel file to JSON
    
    Args:
        input_file (str): Path to Excel file
        output_file (str): Path to output JSON file
    """
    try:
        # Read Excel file - read all columns including the last one
        df = pd.read_excel(input_file, keep_default_na=False)
        
        # Print column names to debug
        print("Columns found in Excel:", df.columns.tolist())
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        # Replace NaN values with empty strings
        df = df.replace({pd.NA: '', None: ''})
        
        # Convert Cooking Time to integer (handles various formats)
        if 'Cooking Time' in df.columns:
            def convert_time(x):
                if pd.isna(x) or x == '':
                    return 0
                # Handle timedelta objects (Excel time format)
                if isinstance(x, pd.Timedelta):
                    return int(x.total_seconds() / 60)  # Convert to minutes
                # Handle datetime.timedelta objects
                if hasattr(x, 'total_seconds'):
                    return int(x.total_seconds() / 60)  # Convert to minutes
                # Handle numeric values
                try:
                    return int(float(x))
                except (ValueError, TypeError):
                    return 0
            
            df['Cooking Time'] = df['Cooking Time'].apply(convert_time)
        
        # Convert to list of dictionaries
        data = df.to_dict(orient='records')
        
        # Write to JSON file with proper formatting
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Successfully converted {input_file} to {output_file}")
        print(f"✓ Total records: {len(data)}")
        
        return data
        
    except Exception as e:
        print(f"Error converting Excel to JSON: {str(e)}")
        raise

# Usage example
if __name__ == "__main__":
    input_file = r"C:\Users\ii234\Downloads\On2Cook Kitchen Recipes Master.xlsx"
    output_file = 'recipes.json'
    
    excel_to_json(input_file, output_file)
    
    # If you want to see the data
    # data = excel_to_json(input_file, output_file)
    # print(json.dumps(data, indent=2))