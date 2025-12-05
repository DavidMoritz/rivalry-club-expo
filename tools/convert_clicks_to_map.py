#!/usr/bin/env python3
import json

# Your click data
click_data = {
  "banjo_kazooie": {"x": 91, "y": 69},
  "bayonetta": {"x": 68, "y": 64},
  "bowser": {"x": 81, "y": 73},
  "bowser_jr": {"x": 114, "y": 77},
  "byleth": {"x": 110, "y": 99},
  "captain_falcon": {"x": 80, "y": 70},
  "chrom": {"x": 100, "y": 54},
  "cloud": {"x": 160, "y": 73},
  "corrin": {"x": 103, "y": 99},
  "daisy": {"x": 99, "y": 93},
  "dark_pit": {"x": 118, "y": 94},
  "dark_samus": {"x": 138, "y": 70},
  "diddy_kong": {"x": 139, "y": 104},
  "donkey_kong": {"x": 135, "y": 95},
  "dr_mario": {"x": 128, "y": 96},
  "duck_hunt": {"x": 80, "y": 119},
  "falco": {"x": 111, "y": 80},
  "fox": {"x": 99, "y": 78},
  "ganondorf": {"x": 152, "y": 65},
  "greninja": {"x": 127, "y": 101},
  "hero": {"x": 151, "y": 121},
  "ice_climbers": {"x": 134, "y": 102},
  "ike": {"x": 119, "y": 71},
  "incineroar": {"x": 126, "y": 103},
  "inkling": {"x": 112, "y": 82},
  "isabelle": {"x": 138, "y": 110},
  "jigglypuff": {"x": 133, "y": 118},
  "joker": {"x": 167, "y": 114},
  "kazuya": {"x": 125, "y": 65},
  "ken": {"x": 112, "y": 87},
  "king_dedede": {"x": 116, "y": 106},
  "king_k_rool": {"x": 74, "y": 87},
  "kirby": {"x": 120, "y": 112},
  "link": {"x": 142, "y": 104},
  "little_mac": {"x": 110, "y": 86},
  "lucario": {"x": 146, "y": 96},
  "lucas": {"x": 109, "y": 100},
  "lucina": {"x": 115, "y": 102},
  "luigi": {"x": 123, "y": 70},
  "mario": {"x": 114, "y": 111},
  "marth": {"x": 121, "y": 58},
  "mega_man": {"x": 123, "y": 96},
  "meta_knight": {"x": 135, "y": 117},
  "mewtwo": {"x": 124, "y": 68},
  "mii_fighters": {"x": 131, "y": 101},
  "min_min": {"x": 99, "y": 129},
  "mr_game_watch": {"x": 80, "y": 121},
  "ness": {"x": 96, "y": 109},
  "olimar": {"x": 107, "y": 124},
  "pac_man": {"x": 122, "y": 103},
  "palutena": {"x": 108, "y": 70},
  "peach": {"x": 129, "y": 120},
  "pichu": {"x": 126, "y": 132},
  "pikachu": {"x": 123, "y": 112},
  "piranha_plant": {"x": 131, "y": 83},
  "pit": {"x": 129, "y": 96},
  "pokemon_trainer": {"x": 109, "y": 104},
  "pyra_mythra": {"x": 93, "y": 75},
  "r_o_b": {"x": 118, "y": 77},
  "richter": {"x": 127, "y": 68},
  "ridley": {"x": 66, "y": 153},
  "robin": {"x": 126, "y": 80},
  "rosalina_luma": {"x": 106, "y": 63},
  "roy": {"x": 154, "y": 108},
  "ryu": {"x": 116, "y": 88},
  "samus": {"x": 132, "y": 72},
  "sephiroth": {"x": 101, "y": 93},
  "sheik": {"x": 150, "y": 134},
  "shulk": {"x": 93, "y": 76},
  "simon": {"x": 157, "y": 87},
  "snake": {"x": 78, "y": 122},
  "sonic": {"x": 86, "y": 97},
  "sora": {"x": 118, "y": 131},
  "steve": {"x": 100, "y": 99},
  "terry": {"x": 110, "y": 72},
  "toon_link": {"x": 133, "y": 114},
  "villager": {"x": 128, "y": 99},
  "wario": {"x": 138, "y": 101},
  "wii_fit_trainer": {"x": 116, "y": 72},
  "wolf": {"x": 164, "y": 98},
  "yoshi": {"x": 83, "y": 106},
  "young_link": {"x": 145, "y": 109},
  "zelda": {"x": 110, "y": 67},
  "zero_suit_samus": {"x": 101, "y": 74}
}

# Multi-character fighters
MULTI_CHARACTER_FIGHTERS = {
    'ice_climbers': 2,
    'banjo_kazooie': 2,
    'pyra_mythra': 2,
    'rosalina_luma': 2,
    'duck_hunt': 2,
    'pokemon_trainer': 3,
    'mii_fighters': 3
}

# Base scale (moderate zoom showing head and shoulders)
BASE_SCALE = 1.6

# Convert click data to character image map format
results = {}

for char_name, coords in click_data.items():
    num_characters = MULTI_CHARACTER_FIGHTERS.get(char_name, 1)

    # Divide scale by number of characters
    scale = BASE_SCALE / num_characters

    results[char_name] = {
        'faceCenter': {
            'x': int(coords['x']),
            'y': int(coords['y'])
        },
        'scale': round(scale, 3),
        'numCharacters': int(num_characters)
    }

# Generate JavaScript file
js_content = """// Auto-generated character image map
// Each entry contains:
// - faceCenter: {x, y} coordinates of the character's face center (manually clicked)
// - scale: proportional scale to make faces roughly the same size
// - numCharacters: number of primary characters in the image

export const characterImageMap = """

js_content += json.dumps(results, indent=2)
js_content += ";\n"

output_path = '../assets/images/games/ssbu/character_image_map.js'
with open(output_path, 'w') as f:
    f.write(js_content)

print(f"✓ Generated {output_path} with {len(results)} characters")
print(f"\nSample entries:")
for char in ['mario', 'luigi', 'link', 'kirby']:
    if char in results:
        data = results[char]
        print(f"  {char}: center({data['faceCenter']['x']}, {data['faceCenter']['y']}), scale: {data['scale']}")
