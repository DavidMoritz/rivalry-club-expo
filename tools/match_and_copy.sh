#!/bin/bash

# Create output directory
mkdir -p ../assets/images/games/ssbu/professor_fandango

# Counter for matches
matches=0
no_matches=0

# Array to track fighters without matches
declare -a unmatched_fighters

# Read all fighter files
while IFS= read -r fighter_path; do
    # Extract fighter name (without path and extension)
    fighter_name=$(basename "$fighter_path" .png)

    # Search for matching file in raw directory
    # Pattern: look for files containing the fighter name (case insensitive)
    # Ignore page numbers and other prefixes
    match_found=false

    # Search for exact match in filename (after page prefix)
    while IFS= read -r raw_file; do
        raw_basename=$(basename "$raw_file")
        # Remove page prefix and numbers (e.g., "page18_101___marth.jpg" -> "marth.jpg")
        cleaned_name=$(echo "$raw_basename" | sed -E 's/^page[0-9]+_[0-9]+___//; s/^page[0-9]+_//')

        # Extract name without extension for comparison
        cleaned_name_no_ext=$(echo "$cleaned_name" | sed 's/\.[^.]*$//')

        # Compare (case insensitive)
        fighter_name_lower=$(echo "$fighter_name" | tr '[:upper:]' '[:lower:]')
        cleaned_name_lower=$(echo "$cleaned_name_no_ext" | tr '[:upper:]' '[:lower:]')
        if [ "$cleaned_name_lower" = "$fighter_name_lower" ]; then
            # Found a match!
            cp "$raw_file" "../assets/images/games/ssbu/professor_fandango/${fighter_name}.jpg"
            echo "✓ Matched: $fighter_name -> $raw_basename"
            matches=$((matches + 1))
            match_found=true
            break
        fi
    done < <(find external/images/raw -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \))

    if [ "$match_found" = false ]; then
        echo "✗ No match: $fighter_name"
        unmatched_fighters+=("$fighter_name")
        no_matches=$((no_matches + 1))
    fi

done < <(find ../assets/images/games/ssbu/fighters -type f -name "*.png" | sort)

echo ""
echo "===== SUMMARY ====="
echo "Matches found: $matches"
echo "No matches: $no_matches"

if [ $no_matches -gt 0 ]; then
    echo ""
    echo "Unmatched fighters:"
    for fighter in "${unmatched_fighters[@]}"; do
        echo "  - $fighter"
    done
fi
