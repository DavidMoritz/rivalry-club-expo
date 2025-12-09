#!/usr/bin/env node

const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// DynamoDB setup
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const USER_TABLE = 'User-eufbm2g2krhd3kvltqwnkdayb4-NONE';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    email: null,
    firstName: null,
    lastName: null,
    password: 'qwerqwer'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--first=')) {
      options.firstName = arg.split('=')[1];
    } else if (arg.startsWith('--last=')) {
      options.lastName = arg.split('=')[1];
    } else if (arg.startsWith('--password=')) {
      options.password = arg.split('=')[1];
    } else if (!arg.startsWith('--')) {
      // First non-flag argument is the email
      if (!options.email) {
        options.email = arg;
      }
    }
  }

  return options;
}

// Generate a random name based on the first letter
function generateRandomName(firstLetter) {
  const names = {
    a: [
      'Alice',
      'Adam',
      'Aaron',
      'Abigail',
      'Andrew',
      'Adrian',
      'Alexandra',
      'Alex',
      'Anthony',
      'Amanda'
    ],
    b: ['Bob', 'Ben', 'Brian', 'Blake', 'Brandon', 'Bradley', 'Bella', 'Bailey', 'Brianna', 'Beth'],
    c: [
      'Charlie',
      'Chris',
      'Carl',
      'Cameron',
      'Caleb',
      'Chloe',
      'Claire',
      'Caroline',
      'Cynthia',
      'Cole'
    ],
    d: ['David', 'Daniel', 'Derek', 'Dylan', 'Dean', 'Diana', 'Danielle', 'Daisy', 'Donna', 'Drew'],
    e: ['Emma', 'Emily', 'Ethan', 'Evan', 'Eric', 'Elizabeth', 'Elena', 'Ella', 'Evelyn', 'Eddie'],
    f: [
      'Frank',
      'Fred',
      'Felix',
      'Finn',
      'Faith',
      'Fiona',
      'Felicity',
      'Frances',
      'Fernando',
      'Floyd'
    ],
    g: [
      'George',
      'Gary',
      'Grant',
      'Greg',
      'Grace',
      'Gabriella',
      'Gemma',
      'Gina',
      'Gabriel',
      'Gavin'
    ],
    h: ['Henry', 'Harry', 'Howard', 'Hunter', 'Hannah', 'Haley', 'Harper', 'Hope', 'Helen', 'Hugh'],
    i: ['Isaac', 'Ian', 'Ivan', 'Isaiah', 'Isabella', 'Iris', 'Ivy', 'Irene', 'Isla', 'India'],
    j: [
      'Jack',
      'James',
      'John',
      'Jake',
      'Jordan',
      'Jessica',
      'Jennifer',
      'Julia',
      'Jasmine',
      'Jane'
    ],
    k: ['Kevin', 'Keith', 'Kyle', 'Ken', 'Katherine', 'Kelly', 'Kate', 'Kimberly', 'Kara', 'Kylie'],
    l: ['Luke', 'Logan', 'Leo', 'Lewis', 'Laura', 'Lucy', 'Lily', 'Lauren', 'Leah', 'Linda'],
    m: ['Mike', 'Matt', 'Mark', 'Max', 'Mason', 'Mary', 'Maria', 'Michelle', 'Megan', 'Madison'],
    n: ['Nathan', 'Nick', 'Noah', 'Neil', 'Nolan', 'Natalie', 'Nicole', 'Nina', 'Naomi', 'Nancy'],
    o: [
      'Oliver',
      'Oscar',
      'Owen',
      'Omar',
      'Olivia',
      'Olive',
      'Odette',
      'Ophelia',
      'Octavia',
      'Orla'
    ],
    p: [
      'Peter',
      'Paul',
      'Patrick',
      'Philip',
      'Parker',
      'Piper',
      'Paige',
      'Penelope',
      'Phoebe',
      'Pearl'
    ],
    q: [
      'Quinn',
      'Quentin',
      'Quincy',
      'Queen',
      'Quinton',
      'Queenie',
      'Quiana',
      'Quilla',
      'Quest',
      'Quade'
    ],
    r: ['Ryan', 'Robert', 'Richard', 'Roger', 'Ross', 'Rachel', 'Rebecca', 'Riley', 'Rose', 'Ruby'],
    s: [
      'Sam',
      'Steve',
      'Scott',
      'Sean',
      'Simon',
      'Sarah',
      'Sophia',
      'Samantha',
      'Stella',
      'Sophie'
    ],
    t: ['Tom', 'Tim', 'Tyler', 'Travis', 'Trevor', 'Tara', 'Taylor', 'Tiffany', 'Teresa', 'Tina'],
    u: ['Ulysses', 'Uriel', 'Urban', 'Umar', 'Ulrich', 'Uma', 'Ursula', 'Unity', 'Unique', 'Una'],
    v: [
      'Victor',
      'Vincent',
      'Vince',
      'Vernon',
      'Vaughn',
      'Victoria',
      'Violet',
      'Vanessa',
      'Vera',
      'Valerie'
    ],
    w: [
      'William',
      'Walter',
      'Wayne',
      'Wesley',
      'Wade',
      'Wendy',
      'Willow',
      'Whitney',
      'Wanda',
      'Winnie'
    ],
    x: [
      'Xavier',
      'Xander',
      'Xerxes',
      'Xavi',
      'Xylon',
      'Xena',
      'Ximena',
      'Xyla',
      'Xiomara',
      'Xandra'
    ],
    y: ['Yusuf', 'Yuri', 'Yale', 'Yosef', 'York', 'Yvonne', 'Yara', 'Yasmin', 'Yolanda', 'Yvette'],
    z: ['Zachary', 'Zane', 'Zack', 'Zeke', 'Zeus', 'Zoe', 'Zelda', 'Zara', 'Zuri', 'Zinnia']
  };

  const letter = firstLetter.toLowerCase();
  const nameList = names[letter] || ['Test'];

  return nameList[Math.floor(Math.random() * nameList.length)];
}

// Get the Cognito User Pool ID from environment or use default
function getUserPoolId() {
  // User Pool ID for: amplifyAuthUserPool4BA7F805-YrqBpiHBdNe3
  const userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-east-1_nYamFUrp4';

  return userPoolId;
}

// Add user to dev-users.json
function addToDevUsers(email, awsSub) {
  const devUsersPath = path.join(__dirname, '../src/lib/dev/dev-users.json');

  try {
    // Read existing file
    const fileContent = fs.readFileSync(devUsersPath, 'utf-8');
    const devUsers = JSON.parse(fileContent);

    // Check if user already exists
    const existingUser = devUsers.users.find((u) => u.email === email);

    if (existingUser) {
      // Update existing user's awsSub
      existingUser.awsSub = awsSub;
      console.log(`✓ Updated existing entry in dev-users.json`);
    } else {
      // Add new user
      devUsers.users.push({
        email,
        awsSub
      });
      console.log(`✓ Added new entry to dev-users.json`);
    }

    // Write back to file with pretty formatting
    fs.writeFileSync(devUsersPath, JSON.stringify(devUsers, null, 2) + '\n', 'utf-8');

    return true;
  } catch (error) {
    console.error(`✗ Failed to update dev-users.json: ${error.message}`);
    return false;
  }
}

// Add user to DynamoDB Users table
async function addToDynamoDB(email, firstName, lastName, awsSub) {
  try {
    const userId = randomUUID();
    const now = new Date().toISOString();

    const userItem = {
      id: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      awsSub: awsSub,
      role: 0, // Default role
      createdAt: now,
      updatedAt: now,
      __typename: 'User'
    };

    const putCommand = new PutCommand({
      TableName: USER_TABLE,
      Item: userItem
    });

    await docClient.send(putCommand);
    console.log(`✓ Added user to DynamoDB Users table (id: ${userId.substring(0, 8)}...)`);

    return userId;
  } catch (error) {
    console.error(`✗ Failed to add user to DynamoDB: ${error.message}`);
    return null;
  }
}

async function createTestUser(email, firstName, lastName, password) {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });
  const userPoolId = getUserPoolId();

  console.log('Creating test user...');
  console.log('='.repeat(50));
  console.log(`Email: ${email}`);
  console.log(`First Name: ${firstName}`);
  console.log(`Last Name: ${lastName}`);
  console.log(`Password: ${password}`);
  console.log('='.repeat(50));

  try {
    // Step 1: Create the user with email verified
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ],
      MessageAction: 'SUPPRESS' // Don't send welcome email
    });

    const createResponse = await client.send(createUserCommand);
    console.log('✓ User created successfully');

    // Extract the user's AWS sub (userId) from the response
    const awsSub = createResponse.User.Username;

    // Step 2: Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true
    });

    await client.send(setPasswordCommand);
    console.log('✓ Password set to permanent');

    console.log('');

    // Step 3: Add to DynamoDB Users table
    const userId = await addToDynamoDB(email, firstName, lastName, awsSub);

    // Step 4: Add to dev-users.json
    addToDevUsers(email, awsSub);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`First Name: ${firstName}`);
    console.log(`Last Name: ${lastName}`);
    console.log(`User Sub (awsSub): ${awsSub}`);
    if (userId) {
      console.log(`DynamoDB User ID: ${userId}`);
    }
    console.log(`Password: ${password}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error creating test user:', error.message);

    if (error.name === 'UsernameExistsException') {
      console.error('\nThis user already exists. Delete it first or use a different email.');
    }

    process.exit(1);
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  if (!options.email) {
    console.error(
      'Usage: node create-test-user.js <email> [--first=FirstName] [--last=LastName] [--password=Password]'
    );
    console.error('\nExample: node create-test-user.js a@a.com');
    console.error(
      'Example: node create-test-user.js b@b.com --first=Bob --last=Builder --password=mypass123'
    );
    process.exit(1);
  }

  // Generate names if not provided
  const firstLetter = options.email.charAt(0);
  const firstName = options.firstName || generateRandomName(firstLetter);
  const lastName = options.lastName || `${generateRandomName(firstLetter)}son`;

  await createTestUser(options.email, firstName, lastName, options.password);
}

main();
