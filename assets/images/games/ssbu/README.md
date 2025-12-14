# Character Face Zoom System

This directory contains a system for displaying zoomed-in, face-focused views of Super Smash Bros. Ultimate characters.

## Files

- **`character_image_map.js`** - Auto-generated map containing face center coordinates and scale factors for each character
- **`use-character-zoom.ts`** - Utility functions for applying zoom transformations
- **`character-face-example.tsx`** - Example React components demonstrating usage
- **`index.ts`** - Exports fighter images and zoom data

## How It Works

Each character image (250x250 pixels) has been analyzed to determine:
1. **Face Center** - The (x, y) coordinates of the character's face center
2. **Scale** - A proportional scale factor to make all faces appear roughly the same size
3. **Num Characters** - How many primary characters are in the image (e.g., Ice Climbers = 2)

The zoom system uses these values to:
- Scale up the image
- Translate it so the face is centered in your display area
- Create a consistent "close-up" effect across all characters

## Usage

### Basic Usage with Function

```typescript
import { Image } from 'react-native';
import { fighterImages } from './assets/images/games/ssbu';
import { getCharacterZoomStyle } from './assets/images/games/ssbu/use-character-zoom';

function MyComponent() {
  const displaySize = 100; // 100x100 pixel container
  const zoomStyle = getCharacterZoomStyle('mario', displaySize);

  return (
    <View style={{ width: displaySize, height: displaySize, overflow: 'hidden' }}>
      <Image
        source={fighterImages.mario}
        style={zoomStyle}
      />
    </View>
  );
}
```

### Using the CharacterFace Component

```typescript
import { CharacterFace } from './assets/images/games/ssbu/character-face-example';

function MyComponent() {
  return (
    <View>
      <CharacterFace characterKey="mario" size={100} />
      <CharacterFace characterKey="link" size={150} />
      <CharacterFace characterKey="samus" size={120} />
    </View>
  );
}
```

### Accessing Raw Zoom Data

```typescript
import { characterZoomMap } from './assets/images/games/ssbu';

const marioData = characterZoomMap.mario;
console.log(marioData);
// {
//   faceCenter: { x: 149, y: 51 },
//   scale: 3.2,
//   numCharacters: 1
// }
```

## Multi-Character Fighters

Some fighters show multiple characters in their image:
- **Ice Climbers** - 2 characters (Popo and Nana)
- **Banjo-Kazooie** - 2 characters
- **Pyra/Mythra** - 2 characters
- **Rosalina & Luma** - 2 characters
- **Duck Hunt** - 2 characters (dog and duck)
- **Pokémon Trainer** - 3 characters (all three Pokémon)
- **Mii Fighters** - 3 characters (Brawler, Gunner, Swordfighter)

For these fighters, the `faceCenter` is positioned between all characters' faces, and the `scale` is divided by the number of characters to maintain consistency.

## Regenerating the Map

If you update the character images, regenerate the map by running:

```bash
python3 analyze_characters.py
```

This will:
1. Analyze all images in `external/images/professor_fandango/`
2. Detect face positions
3. Calculate appropriate scales
4. Generate a new `character_image_map.js`

## Technical Details

### Image Specifications
- All source images are normalized to **250x250 pixels**
- Images are stored in `professor_fandango/` directory
- Format: JPEG

### Zoom Calculation
```typescript
// Scale the image
const scaledSize = 250 * scale;

// Translate to center the face
const translateX = displaySize / 2 - faceCenter.x * scale;
const translateY = displaySize / 2 - faceCenter.y * scale;
```

### Container Requirements
- Must have `overflow: 'hidden'` to clip the zoomed image
- Should be square (width = height) for best results
- Size can be any value; the zoom system adapts automatically

## Example: Grid of Character Faces

```typescript
function CharacterRoster() {
  const fighters = ['mario', 'luigi', 'peach', 'bowser', 'yoshi'];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {fighters.map(fighter => (
        <CharacterFace
          key={fighter}
          characterKey={fighter}
          size={80}
          style={{ margin: 4, borderRadius: 40 }}
        />
      ))}
    </View>
  );
}
```

This creates a grid of circular character face close-ups, all consistently sized regardless of the character's original proportions in the image.
