# Dev Users Configuration

This file explains how to configure test users for development in Expo Go.

## Setup

1. Copy the example file:
   ```bash
   cp src/lib/dev/dev-users.json.example src/lib/dev/dev-users.json
   ```

2. Edit `src/lib/dev/dev-users.json` to add your test users:
   ```json
   {
     "users": [
       {
         "email": "t@t.t",
         "awsSub": "test-user-1",
         "firstName": "Test",
         "lastName": "User"
       },
       {
         "email": "another@test.com",
         "awsSub": "test-user-2",
         "firstName": "Another",
         "lastName": "Test"
       }
     ]
   }
   ```

## How It Works

When running in **Expo Go** (not a development build):

1. Cognito authentication is bypassed completely
2. You can "sign in" with any email address listed in `src/lib/dev/dev-users.json`
3. The password field is ignored (you can enter anything)
4. The app will look up the user by email and use their `awsSub` from the config
5. If the user doesn't exist in the database, it will be created automatically

## Usage

1. Open the app in Expo Go
2. Enter one of the test emails from `src/lib/dev/dev-users.json`
3. Enter any password (it's ignored in Expo Go)
4. Click "Sign In"
5. The app will create/fetch the user from the database using the `awsSub` from the config

## Production Builds

In production builds (after running `npx expo prebuild`):

- This config file is ignored
- Real Cognito authentication is used
- Users must have valid Cognito accounts

## Git Ignore

The `src/lib/dev/dev-users.json` file is git-ignored so you can add your own test users without committing them to the repository. Only the `src/lib/dev/dev-users.json.example` template is committed.
