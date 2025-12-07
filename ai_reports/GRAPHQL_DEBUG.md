# GraphQL Debug Information

## How to Test Contest Queries in Postman

### 1. Get your GraphQL endpoint and API key

The GraphQL endpoint and API key are in your `src/aws-exports.ts` file:
- Endpoint: Look for `aws_appsync_graphqlEndpoint`
- API Key: Look for `aws_appsync_apiKey`

### 2. Set up Postman

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE
```

**Request Type:** POST

**URL:** Your GraphQL endpoint from aws-exports.ts

### 3. Query to list contests

**Body (raw JSON):**
```json
{
  "query": "query ListContests($filter: ModelContestFilterInput, $limit: Int, $nextToken: String) { listContests(filter: $filter, limit: $limit, nextToken: $nextToken) { items { id rivalryId result tierSlotAId tierSlotBId createdAt updatedAt } nextToken } }",
  "variables": {
    "filter": {
      "rivalryId": {
        "eq": "YOUR_RIVALRY_ID_HERE"
      }
    },
    "limit": 100
  }
}
```

### 4. What to look for in the response

The response will show:
- All contests for the rivalry
- Their `createdAt` timestamps
- The order they come back from the database

Compare this with what you see in the app to identify any sorting issues.

### 5. Current Console Logs

When you load the history page, look for these logs:
- `[HistoryRoute] Fetching contests for rivalry:` - Shows the rivalry ID
- `[HistoryRoute] Query parameters:` - Shows what we're sending
- `[HistoryRoute] Raw contest data (first 3):` - Shows the first 3 contests as received
- `[HistoryRoute] All createdAt timestamps:` - Shows all timestamps in order received
- `[HistoryRoute] After sorting - first 5 createdAt:` - Shows the order after JavaScript sorting

These logs will help identify if:
1. The database is returning contests in the wrong order
2. The JavaScript sorting isn't working
3. Some contests are missing
