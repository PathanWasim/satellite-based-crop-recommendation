import os
import ssl
import random
import pandas as pd
import shutil
from torchvision.datasets import EuroSAT
from tqdm import tqdm

# Fix for SSL certificate verify failed
ssl._create_default_https_context = ssl._create_unverified_context

DATA_ROOT = '../data'
OUTPUT_CSV = '../data/crops_full.csv'

# EuroSAT Classes:
# 'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway', 'Industrial', 
# 'Pasture', 'PermanentCrop', 'Residential', 'River', 'SeaLake'

def generate_synthetic_features(label):
    """
    Generates synthetic environmental features based on the land cover type.
    Returns: ph, N, P, K, rainfall, temp, lat, lon
    """
    # Defaults
    ph = round(random.uniform(5.5, 7.5), 1)
    N = random.randint(10, 50)
    P = random.randint(10, 50)
    K = random.randint(10, 50)
    rainfall = random.randint(500, 1500)
    temp = round(random.uniform(15.0, 35.0), 1)
    # Random lat/lon within a region (e.g., India)
    lat = round(random.uniform(8.0, 37.0), 2)
    lon = round(random.uniform(68.0, 97.0), 2)

    # Specific Logic for Crops
    if label == 'Rice':
        # Rice needs lots of water and high temp
        rainfall = random.randint(1500, 3000)
        temp = round(random.uniform(25.0, 35.0), 1)
        ph = round(random.uniform(5.5, 7.0), 1) # Slightly acidic
        N = random.randint(40, 80)
    elif label == 'Wheat':
        # Wheat needs moderate water and cooler temp
        rainfall = random.randint(400, 1000)
        temp = round(random.uniform(15.0, 25.0), 1)
        ph = round(random.uniform(6.0, 7.5), 1)
        N = random.randint(50, 100)
    elif label == 'Maize':
        # Maize needs high Nitrogen
        rainfall = random.randint(600, 1200)
        temp = round(random.uniform(20.0, 30.0), 1)
        N = random.randint(80, 150) # High N
    
    # Logic for other EuroSAT classes
    elif label == 'PermanentCrop':
        N = random.randint(30, 70)
        P = random.randint(20, 60)
    elif label == 'Forest':
        rainfall = random.randint(1200, 2500)
        ph = round(random.uniform(5.0, 6.5), 1)
        N = random.randint(10, 30)
    elif label == 'River' or label == 'SeaLake':
        rainfall = random.randint(1000, 3000)
        N = random.randint(0, 10)
    elif label in ['Industrial', 'Residential', 'Highway']:
        N = random.randint(0, 20)
        P = random.randint(0, 20)
        K = random.randint(0, 20)
    
    return ph, N, P, K, rainfall, temp, lat, lon

def main():
    print("Downloading EuroSAT dataset...")
    try:
        dataset = EuroSAT(root=DATA_ROOT, download=True)
    except Exception as e:
        print(f"Error downloading: {e}")
        return

    print("Dataset downloaded. Generating synthetic tabular data for specific crops...")
    
    data_rows = []
    base_path = os.path.join(DATA_ROOT, 'eurosat', '2750')
    classes = os.listdir(base_path)
    
    for cls_name in tqdm(classes):
        cls_dir = os.path.join(base_path, cls_name)
        if not os.path.isdir(cls_dir):
            continue
            
        for img_name in os.listdir(cls_dir):
            if not img_name.endswith('.jpg'):
                continue
                
            rel_path = f"eurosat/2750/{cls_name}/{img_name}"
            
            # --- CRITICAL CHANGE: Assign Specific Crop Labels ---
            final_label = cls_name
            
            if cls_name == 'AnnualCrop':
                # Randomly assign to Wheat, Rice, or Maize
                # This creates the "Hybrid Challenge": Image is same, Tabular is different
                final_label = random.choice(['Wheat', 'Rice', 'Maize'])
            
            # Generate features based on the FINAL label
            ph, N, P, K, rainfall, temp, lat, lon = generate_synthetic_features(final_label)
            
            data_rows.append({
                'image_path': rel_path,
                'ph': ph,
                'N': N,
                'P': P,
                'K': K,
                'rainfall': rainfall,
                'temp': temp,
                'lat': lat,
                'lon': lon,
                'crop_label': final_label # Use the specific label
            })
            
    # Save to CSV
    df = pd.DataFrame(data_rows)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Successfully created {OUTPUT_CSV} with {len(df)} samples.")
    print("Classes found:", sorted(df['crop_label'].unique()))

if __name__ == '__main__':
    main()
