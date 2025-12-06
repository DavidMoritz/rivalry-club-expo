#!/bin/bash

# IDs of rivalries that don't have 'accepted' field or have it as string
RIVALRY_IDS=(
  "484acff2-6301-11ee-a22d-169ccb685861"
  "484adcbe-6301-11ee-a22d-169ccb685861"
  "484ad6d4-6301-11ee-a22d-169ccb685861"
  "51f1bd59-94a2-4748-a01a-c42fd2a71142"
  "484ae0cb-6301-11ee-a22d-169ccb685861"
  "484ad472-6301-11ee-a22d-169ccb685861"
  "484ada64-6301-11ee-a22d-169ccb685861"
  "484ae2ac-6301-11ee-a22d-169ccb685861"
  "733bc889-19f3-45ff-8926-fb0bc04c0468"
  "484ae167-6301-11ee-a22d-169ccb685861"
  "484ad771-6301-11ee-a22d-169ccb685861"
  "484ad63c-6301-11ee-a22d-169ccb685861"
  "484adc2a-6301-11ee-a22d-169ccb685861"
  "484adaf9-6301-11ee-a22d-169ccb685861"
  "484acf02-6301-11ee-a22d-169ccb685861"
  "484ad139-6301-11ee-a22d-169ccb685861"
  "484ae474-6301-11ee-a22d-169ccb685861"
  "484ad50b-6301-11ee-a22d-169ccb685861"
  "484ad5a4-6301-11ee-a22d-169ccb685861"
  "484ad9cd-6301-11ee-a22d-169ccb685861"
  "484adf0f-6301-11ee-a22d-169ccb685861"
  "484ae037-6301-11ee-a22d-169ccb685861"
  "484adb90-6301-11ee-a22d-169ccb685861"
  "484ae203-6301-11ee-a22d-169ccb685861"
  "484ad285-6301-11ee-a22d-169ccb685861"
  "484acbf9-6301-11ee-a22d-169ccb685861"
  "484ae344-6301-11ee-a22d-169ccb685861"
  "484ad805-6301-11ee-a22d-169ccb685861"
  "484ad938-6301-11ee-a22d-169ccb685861"
  "484ad3c9-6301-11ee-a22d-169ccb685861"
  "484add53-6301-11ee-a22d-169ccb685861"
  "484ae3dc-6301-11ee-a22d-169ccb685861"
  "484ad89b-6301-11ee-a22d-169ccb685861"
  "484adfa5-6301-11ee-a22d-169ccb685861"
  "484adde9-6301-11ee-a22d-169ccb685861"
  "484ad1d2-6301-11ee-a22d-169ccb685861"
  "484ad09d-6301-11ee-a22d-169ccb685861"
)

TABLE_NAME="Rivalry-eufbm2g2krhd3kvltqwnkdayb4-NONE"
REGION="us-east-1"

echo "Updating ${#RIVALRY_IDS[@]} rivalries..."

for id in "${RIVALRY_IDS[@]}"; do
  echo "Updating rivalry $id..."
  aws dynamodb update-item \
    --table-name "$TABLE_NAME" \
    --region "$REGION" \
    --key "{\"id\": {\"S\": \"$id\"}}" \
    --update-expression "SET accepted = :val" \
    --expression-attribute-values '{":val": {"BOOL": true}}' \
    --no-cli-pager
  
  if [ $? -eq 0 ]; then
    echo "  ✓ Updated $id"
  else
    echo "  ✗ Failed to update $id"
  fi
done

echo "Done!"
