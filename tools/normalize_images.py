#!/usr/bin/env python3
import os
from PIL import Image

def get_image_dimensions(image_path):
    """Get the pixel dimensions of an image"""
    img = Image.open(image_path)
    return img.size  # (width, height)

def scale_image(image_path, target_pixels):
    """Scale image to have approximately target_pixels total pixels"""
    img = Image.open(image_path)
    width, height = img.size
    current_pixels = width * height

    if current_pixels <= target_pixels:
        return False  # No need to scale down

    # Calculate scale factor
    scale_factor = (target_pixels / current_pixels) ** 0.5
    new_width = int(width * scale_factor)
    new_height = int(height * scale_factor)

    print(f"  Scaling from {width}x{height} ({current_pixels:,} px) to {new_width}x{new_height} ({new_width*new_height:,} px)")

    # Resize with high-quality downsampling
    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Save back to same location with high quality
    img_resized.save(image_path, 'JPEG', quality=95, optimize=True)

    return True

# Get reference dimensions from a small file
image_dir = '../assets/images/games/ssbu/professor_fandango'
reference_file = os.path.join(image_dir, 'kirby.jpg')
ref_width, ref_height = get_image_dimensions(reference_file)
reference_pixels = ref_width * ref_height

print(f"Reference image (kirby.jpg): {ref_width}x{ref_height} = {reference_pixels:,} pixels\n")

# Large images to scale down significantly
large_images = ['hero.jpg', 'terry.jpg', 'byleth.jpg', 'shulk.jpg']

# Medium images (22KB-65KB range)
# These are slightly larger and should be scaled to match reference
medium_images = [
    'mii_fighters.jpg', 'banjo_kazooie.jpg', 'pyra_mythra.jpg',
    'pokemon_trainer.jpg', 'inkling.jpg', 'cloud.jpg'
]

print("=" * 60)
print("SCALING LARGE IMAGES (hero, terry, byleth, shulk)")
print("=" * 60)

for filename in large_images:
    filepath = os.path.join(image_dir, filename)
    if os.path.exists(filepath):
        print(f"\n{filename}:")
        scale_image(filepath, reference_pixels)

print("\n" + "=" * 60)
print("SCALING MEDIUM IMAGES (22KB-65KB range)")
print("=" * 60)

for filename in medium_images:
    filepath = os.path.join(image_dir, filename)
    if os.path.exists(filepath):
        print(f"\n{filename}:")
        scale_image(filepath, reference_pixels)

print("\n✓ Image normalization complete!")
print(f"\nAll images normalized to approximately {reference_pixels:,} pixels")
