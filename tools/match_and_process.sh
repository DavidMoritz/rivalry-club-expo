#!/bin/bash

# Directory paths
FIGHTERS_DIR="../assets/images/games/ssbu/fighters"
EXTERNAL_DIR="../../external/images"
OUTPUT_DIR="../../external/images/no_bg"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Counter for matches
matches=0
processed=0

# Loop through each fighter image
for fighter_file in "$FIGHTERS_DIR"/*.png; do
    # Get the base name without extension
    fighter_name=$(basename "$fighter_file" .png)

    echo "Looking for match for: $fighter_name"

    # Search for matching jpg in external/images
    # Pattern: looking for files that contain the fighter name (ignoring page numbers and other prefixes)
    match_file=$(ls "$EXTERNAL_DIR"/*.jpg 2>/dev/null | grep -i "___${fighter_name}\.jpg$" | head -1)

    # If no match with ___, try without
    if [ -z "$match_file" ]; then
        match_file=$(ls "$EXTERNAL_DIR"/*.jpg 2>/dev/null | grep -i "_${fighter_name}\.jpg$" | head -1)
    fi

    # If still no match, try exact match
    if [ -z "$match_file" ]; then
        match_file="$EXTERNAL_DIR/${fighter_name}.jpg"
        if [ ! -f "$match_file" ]; then
            match_file=""
        fi
    fi

    if [ -n "$match_file" ]; then
        echo "  Found match: $match_file"
        matches=$((matches + 1))

        # Process with rembg
        output_file="$OUTPUT_DIR/${fighter_name}.png"
        echo "  Processing with rembg -> $output_file"
        rembg i "$match_file" "$output_file"

        if [ $? -eq 0 ]; then
            processed=$((processed + 1))
            echo "  ✓ Successfully processed"
        else
            echo "  ✗ Failed to process"
        fi
    else
        echo "  No match found"
    fi
    echo ""
done

echo "================================"
echo "Summary:"
echo "  Matches found: $matches"
echo "  Successfully processed: $processed"
echo "================================"
