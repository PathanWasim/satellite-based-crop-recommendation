import torch
from torch.utils.data import Dataset
from PIL import Image
import pandas as pd
import os

class CropDataset(Dataset):
    def __init__(self, csv_file, root_dir, transform=None, crop_classes=None, tab_columns=None):
        """
        Args:
            csv_file (string): Path to the csv file with annotations.
            root_dir (string): Directory with all the images.
            transform (callable, optional): Optional transform to be applied on a sample.
            crop_classes (list): List of class names to map to integers.
            tab_columns (list): List of columns to use as tabular features.
        """
        self.data_frame = pd.read_csv(csv_file)
        self.root_dir = root_dir
        self.transform = transform
        self.crop_classes = crop_classes
        self.tab_columns = tab_columns
        
        # Create class to index mapping
        self.class_to_idx = {cls_name: idx for idx, cls_name in enumerate(self.crop_classes)}

    def __len__(self):
        return len(self.data_frame)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()

        # Load Image
        img_name = os.path.join(self.root_dir, self.data_frame.iloc[idx]['image_path'])
        image = Image.open(img_name).convert('RGB')

        if self.transform:
            image = self.transform(image)

        # Load Tabular Data
        # Extract specified columns and convert to float tensor
        tab_data = self.data_frame.iloc[idx][self.tab_columns].values.astype('float32')
        tab_data = torch.tensor(tab_data)

        # Load Label
        label_str = self.data_frame.iloc[idx]['crop_label']
        label = self.class_to_idx[label_str]
        label = torch.tensor(label, dtype=torch.long)

        return image, tab_data, label
