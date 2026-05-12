import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # Violet primary color: #7c3aed
    img = Image.new('RGB', (size, size), color='#7c3aed')
    d = ImageDraw.Draw(img)
    
    # Try to add a simple "Z" in the center
    # We will just draw some shapes to look like a Z
    thickness = size // 6
    margin = size // 4
    
    # Top bar
    d.rectangle([margin, margin, size - margin, margin + thickness], fill='white')
    # Bottom bar
    d.rectangle([margin, size - margin - thickness, size - margin, size - margin], fill='white')
    # Diagonal
    d.polygon([
        (size - margin, margin),
        (size - margin - thickness, margin),
        (margin, size - margin),
        (margin + thickness, size - margin)
    ], fill='white')

    img.save(filename)

if __name__ == '__main__':
    public_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'public')
    os.makedirs(public_dir, exist_ok=True)
    
    create_icon(192, os.path.join(public_dir, 'pwa-192x192.png'))
    create_icon(512, os.path.join(public_dir, 'pwa-512x512.png'))
    create_icon(180, os.path.join(public_dir, 'apple-touch-icon.png'))
    print("Icons generated successfully!")
