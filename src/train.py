import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms
import os

from model import LiteGeoNet
from dataset import CropDataset

# --- Configuration ---
CSV_FILE = '../data/crops.csv'
IMG_DIR = '../data' # dataset.py joins root_dir + image_path (which is images/field_x.png)
CHECKPOINT_PATH = 'model_checkpoint.pth'
NUM_EPOCHS = 5
BATCH_SIZE = 2
LEARNING_RATE = 0.001

CROP_CLASSES = ['Wheat', 'Rice', 'Maize']
TAB_COLUMNS = ['ph', 'N', 'P', 'K', 'rainfall', 'temp', 'lat', 'lon']

def main():
    print("Initializing Training...")
    
    # 1. Transforms
    # Resize to 224x224 (standard for EfficientNet), convert to tensor, normalize
    data_transform = transforms.Compose([
        transforms.Resize((224, 224)),
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
    
    dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)
    print(f"Loaded {len(dataset)} samples.")
    
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
        
        for images, tab_data, labels in dataloader:
            images = images.to(device)
            tab_data = tab_data.to(device)
            labels = labels.to(device)
            
            optimizer.zero_grad()
            
            outputs, _ = model(images, tab_data) # We ignore gating weights during training
            loss = criterion(outputs, labels)
            
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
        epoch_loss = running_loss / len(dataloader)
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
