import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms
import os
import pandas as pd

from model import LiteGeoNet
from dataset import CropDataset

# --- Configuration ---
CSV_FILE = '../data/crops_full.csv' # Changed to full dataset
IMG_DIR = '../data' 
CHECKPOINT_PATH = 'model_checkpoint_full.pth'
NUM_EPOCHS = 1 # Just 1 epoch for verification
BATCH_SIZE = 32 # Larger batch size
LEARNING_RATE = 0.001

# Load classes dynamically from CSV
df = pd.read_csv(CSV_FILE)
CROP_CLASSES = sorted(df['crop_label'].unique().tolist())
TAB_COLUMNS = ['ph', 'N', 'P', 'K', 'rainfall', 'temp', 'lat', 'lon']

def main():
    print(f"Initializing Training on {len(df)} samples...")
    print(f"Classes: {CROP_CLASSES}")
    
    # 1. Transforms
    data_transform = transforms.Compose([
        transforms.Resize((64, 64)), # EuroSAT is 64x64
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # 2. Dataset & DataLoader
    dataset = CropDataset(
        csv_file=CSV_FILE,
        root_dir=IMG_DIR,
        transform=data_transform,
        crop_classes=CROP_CLASSES,
        tab_columns=TAB_COLUMNS
    )
    
    # Split into train/val (simple split)
    train_size = int(0.8 * len(dataset))
    val_size = len(dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    
    print(f"Train size: {len(train_dataset)}, Val size: {len(val_dataset)}")
    
    # 3. Model Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = LiteGeoNet(num_classes=len(CROP_CLASSES), num_tabular_features=len(TAB_COLUMNS))
    model.to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # 4. Training Loop
    model.train()
    for epoch in range(NUM_EPOCHS):
        running_loss = 0.0
        correct = 0
        total = 0
        
        for i, (images, tab_data, labels) in enumerate(train_loader):
            images = images.to(device)
            tab_data = tab_data.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs, _ = model(images, tab_data)
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
            if i % 10 == 0:
                print(f"Step [{i}/{len(train_loader)}] Loss: {loss.item():.4f}")
            
        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100 * correct / total
        print(f"Epoch [{epoch+1}/{NUM_EPOCHS}] Loss: {epoch_loss:.4f} Accuracy: {epoch_acc:.2f}%")
        
    print("Training Finished.")
    
    # 5. Save Checkpoint
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'crop_classes': CROP_CLASSES,
        'tab_columns': TAB_COLUMNS
    }
    torch.save(checkpoint, CHECKPOINT_PATH)
    print(f"Model saved to {CHECKPOINT_PATH}")

if __name__ == '__main__':
    main()
