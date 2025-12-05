import torch
import torch.nn as nn
import timm

class LiteGeoNet(nn.Module):
    def __init__(self, num_classes=3, num_tabular_features=8):
        super(LiteGeoNet, self).__init__()
        
        # 1. Image Backbone (EfficientNet-B0)
        # We use a pretrained model and remove the classifier
        self.backbone = timm.create_model('efficientnet_b0', pretrained=True, num_classes=0)
        # EfficientNet-B0 outputs 1280 dim features
        self.img_feature_dim = 1280
        
        # 2. Tabular MLP
        # Simple MLP to encode environmental features
        self.tab_mlp = nn.Sequential(
            nn.Linear(num_tabular_features, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU()
        )
        self.tab_feature_dim = 32
        
        # 3. Gating Fusion Layer (Research Contribution)
        # We want to learn how much to trust image vs tabular features.
        # We'll project both to a common dimension, then compute a weight.
        self.fusion_dim = 64
        
        self.img_project = nn.Linear(self.img_feature_dim, self.fusion_dim)
        self.tab_project = nn.Linear(self.tab_feature_dim, self.fusion_dim)
        
        # Gating network: takes concatenated features -> outputs scalar weight (sigmoid)
        # If output is close to 1, trust image more. If 0, trust tabular more.
        # Or we can output 2 weights (softmax). Let's do 2 weights for clarity.
        self.gate_net = nn.Sequential(
            nn.Linear(self.fusion_dim * 2, 16),
            nn.ReLU(),
            nn.Linear(16, 2),
            nn.Softmax(dim=1)
        )
        
        # 4. Classifier Head
        # Takes the fused representation
        self.classifier = nn.Sequential(
            nn.Linear(self.fusion_dim, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )

    def forward(self, img, tab_data):
        # Extract Image Features
        img_feat = self.backbone(img) # [Batch, 1280]
        
        # Extract Tabular Features
        tab_feat = self.tab_mlp(tab_data) # [Batch, 32]
        
        # Project to common dimension
        img_emb = self.img_project(img_feat) # [Batch, 64]
        tab_emb = self.tab_project(tab_feat) # [Batch, 64]
        
        # Calculate Gating Weights
        # Concatenate embeddings to decide weights
        combined = torch.cat([img_emb, tab_emb], dim=1) # [Batch, 128]
        gate_weights = self.gate_net(combined) # [Batch, 2] -> [w_img, w_tab]
        
        w_img = gate_weights[:, 0].unsqueeze(1)
        w_tab = gate_weights[:, 1].unsqueeze(1)
        
        # Weighted Fusion
        fused_feat = (w_img * img_emb) + (w_tab * tab_emb)
        
        # Classification
        logits = self.classifier(fused_feat)
        
        return logits, gate_weights
