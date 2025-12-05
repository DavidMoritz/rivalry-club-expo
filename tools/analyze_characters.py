#!/usr/bin/env python3
import os
import json
from PIL import Image
import numpy as np

def analyze_image(image_path):
    """Analyze an image to find the center of the character's face/head"""
    img = Image.open(image_path)
    img_array = np.array(img)

    # Get dimensions
    height, width = img_array.shape[:2]

    # Find bounding box of non-transparent/non-white content
    if img.mode == 'RGBA':
        # Use alpha channel
        alpha = img_array[:, :, 3]
        mask = alpha > 30  # Consider pixels with alpha > 30
    else:
        # For RGB, find non-white pixels
        gray = np.mean(img_array, axis=2) if len(img_array.shape) > 2 else img_array
        mask = gray < 250

    if not mask.any():
        # No content found, use center
        return {
            'centerX': width // 2,
            'centerY': height // 2,
            'width': width,
            'height': height,
            'contentHeight': height
        }

    # Find bounding box
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)

    if not rows.any() or not cols.any():
        return {
            'centerX': width // 2,
            'centerY': height // 2,
            'width': width,
            'height': height,
            'contentHeight': height
        }

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    content_height = rmax - rmin + 1
    content_width = cmax - cmin + 1

    # Face is typically in upper 20-35% of total character height
    # Use a weighted approach - prefer middle of the upper region
    face_region_start = rmin + int(content_height * 0.15)  # Start 15% down
    face_region_end = rmin + int(content_height * 0.35)    # End at 35%

    if face_region_end <= face_region_start:
        # Content too small, use simple center
        face_center_x = (cmin + cmax) // 2
        face_center_y = rmin + int(content_height * 0.25)
    else:
        # Find center of mass in the face region
        face_mask = mask[face_region_start:face_region_end, cmin:cmax+1]

        if face_mask.any():
            # Get center of mass
            y_indices, x_indices = np.where(face_mask)
            if len(y_indices) > 0 and len(x_indices) > 0:
                face_center_y = int(np.mean(y_indices)) + face_region_start
                face_center_x = int(np.mean(x_indices)) + cmin
            else:
                face_center_x = (cmin + cmax) // 2
                face_center_y = (face_region_start + face_region_end) // 2
        else:
            # Fallback to center of face region
            face_center_x = (cmin + cmax) // 2
            face_center_y = (face_region_start + face_region_end) // 2

    return {
        'centerX': face_center_x,
        'centerY': face_center_y,
        'width': width,
        'height': height,
        'contentHeight': content_height,
        'contentWidth': content_width
    }

# Known multi-character fighters
MULTI_CHARACTER_FIGHTERS = {
    'ice_climbers': 2,
    'banjo_kazooie': 2,
    'pyra_mythra': 2,
    'rosalina_luma': 2,
    'duck_hunt': 2,
    'pokemon_trainer': 3,  # Shows all 3 Pokemon
    'mii_fighters': 3,  # Shows all 3 Mii types (Brawler, Gunner, Swordfighter)
}

# Load existing map to preserve multi-character entries
existing_map_path = '../assets/images/games/ssbu/character_image_map.js'
existing_results = {}

try:
    with open(existing_map_path, 'r') as f:
        content = f.read()
        # Extract the JSON object from the JS file
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            existing_results = json.loads(content[json_start:json_end])
            print(f"Loaded {len(existing_results)} existing entries\n")
except Exception as e:
    print(f"Could not load existing map: {e}\n")

# Process all images
image_dir = '../assets/images/games/ssbu/professor_fandango'
results = {}

for filename in sorted(os.listdir(image_dir)):
    if filename.endswith('.jpg'):
        name = filename.replace('.jpg', '')
        image_path = os.path.join(image_dir, filename)

        # Determine number of primary characters
        num_characters = MULTI_CHARACTER_FIGHTERS.get(name, 1)

        # Only re-analyze single character fighters
        if num_characters > 1 and name in existing_results:
            print(f"Skipping {name} (multi-character, keeping existing data)...")
            results[name] = existing_results[name]
            continue

        print(f"Analyzing {name}...")

        analysis = analyze_image(image_path)

        # Calculate scale based on content height
        # Base scale on making character faces roughly visible but not too zoomed
        # Adjust for multiple characters
        base_scale = 1.0
        if analysis['contentHeight'] > 0:
            # Target a more moderate zoom - showing more of the character
            # Instead of isolating just the face, show head and shoulders
            target_face_height = 60  # Reduced from 120 for less zoom
            # Estimate face is about 15% of total character height
            estimated_face_height = analysis['contentHeight'] * 0.15
            if estimated_face_height > 0:
                base_scale = target_face_height / estimated_face_height

        # Divide scale by number of characters
        scale = base_scale / num_characters

        results[name] = {
            'faceCenter': {
                'x': int(analysis['centerX']),
                'y': int(analysis['centerY'])
            },
            'scale': round(float(scale), 3),
            'numCharacters': int(num_characters)
        }

# Generate JavaScript file
js_content = """// Auto-generated character image map
// Each entry contains:
// - faceCenter: {x, y} coordinates of the character's face center
// - scale: proportional scale to make faces roughly the same size
// - numCharacters: number of primary characters in the image

export const characterImageMap = """

js_content += json.dumps(results, indent=2)
js_content += ";\n"

output_path = '../assets/images/games/ssbu/character_image_map.js'
with open(output_path, 'w') as f:
    f.write(js_content)

print(f"\n✓ Generated {output_path} with {len(results)} characters")
