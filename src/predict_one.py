import torch
from torchvision import transforms
from PIL import Image
import pandas as pd
import os

from model import LiteGeoNet

# --- Configuration ---
CHECKPOINT_PATH = 'model_checkpoint_full.pth'
# Sample to predict (using the first one from our dummy data)
TEST_IMAGE_PATH = '../data/images/field_2.png' 
# Sample tabular data (ph, N, P, K, rainfall, temp, lat, lon)
TEST_TABULAR = [6.4,25,18,14,900,30.1,19.10,73.80] 

def main():
    print("Loading Model...")
    
    # 1. Load Checkpoint
    if not os.path.exists(CHECKPOINT_PATH):
        print(f"Error: Checkpoint {CHECKPOINT_PATH} not found. Run train.py first.")
        return

    checkpoint = torch.load(CHECKPOINT_PATH)
    crop_classes = checkpoint['crop_classes']
    tab_columns = checkpoint['tab_columns']
    
    # 2. Initialize Model
    model = LiteGeoNet(num_classes=len(crop_classes), num_tabular_features=len(tab_columns))
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    # 3. Prepare Input
    # Image
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    image = Image.open(TEST_IMAGE_PATH).convert('RGB')
    image_tensor = transform(image).unsqueeze(0) # Add batch dim
    
    # Tabular
    tab_tensor = torch.tensor(TEST_TABULAR, dtype=torch.float32).unsqueeze(0) # Add batch dim
    
    # 4. Inference
    print(f"Predicting for image: {TEST_IMAGE_PATH}")
    print(f"Tabular data: {TEST_TABULAR}")
    
    with torch.no_grad():
        logits, gate_weights = model(image_tensor, tab_tensor)
        probabilities = torch.softmax(logits, dim=1)
        
        # Get prediction
        conf, pred_idx = torch.max(probabilities, 1)
        predicted_crop = crop_classes[pred_idx.item()]
        confidence = conf.item()
        
        # Get gating weights
        w_img = gate_weights[0, 0].item()
        w_tab = gate_weights[0, 1].item()
        
    # 5. Output Results
    print("-" * 30)
    print(f"Predicted Crop: {predicted_crop}")
    print(f"Confidence:     {confidence:.4f}")
    print("-" * 30)
    print("Gating Weights (Importance):")
    print(f"Image:   {w_img:.4f}")
    print(f"Tabular: {w_tab:.4f}")
    print("-" * 30)

if __name__ == '__main__':
    main()
