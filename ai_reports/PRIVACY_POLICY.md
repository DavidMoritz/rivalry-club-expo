# Privacy Policy for Rivalry Club

**Last Updated**: December 13, 2025

## Introduction

Rivalry Club ("we", "our", "us") is a mobile application for iOS that allows users to create and manage fighting game character tier lists and compete in private rivalries with other users. This Privacy Policy explains how we collect, use, and protect your personal information.

This policy has been drafted to accurately reflect the actual data practices of our mobile application, without including generic template language for services we don't provide.

## Information We Collect

### 1. Account Information

When you create an account, we collect:

- **Email address** - Used for authentication and account recovery
- **Password** - Stored securely using AWS Cognito authentication service
- **User ID** - Automatically generated unique identifier

### 2. Usage Data

When you use the mobile app, we automatically collect:

- **Device type and operating system** - To ensure compatibility
- **App screens viewed** - To understand feature usage
- **Session duration** - To improve app performance
- **Device identifiers** - For authentication and security purposes
- **Crash reports** - To identify and fix technical issues

### 3. Game and Rivalry Data

During normal use of the app, we collect:

- **Tier list rankings** - Your character rankings for fighting games
- **Rivalry information** - Your competitive matches with other users (1-on-1 only)
- **Contest results** - Win/loss records and statistics
- **Fighter statistics** - Aggregate data about character performance

## How We Use Your Information

We use your information solely to:

1. **Provide core app functionality** - Enable authentication, tier list creation, and rivalry tracking
2. **Maintain your account** - Manage your login credentials and user profile
3. **Store your game data** - Save your tier lists, rivalries, and contest history
4. **Improve the app** - Analyze usage patterns to fix bugs and enhance features
5. **Communicate with you** - Send account-related notifications (if implemented in future versions)

## Data Storage and Service Providers

Your data is stored using Amazon Web Services (AWS):

- **AWS Cognito** - Handles user authentication and secure password storage
- **AWS Amplify with GraphQL API** - Stores and manages all application data (games, fighters, rivalries, tier lists, contests)
- **AWS S3** - Hosts fighter character images and app assets

These services are configured in accordance with AWS security best practices and are located in AWS data centers.

## Data Sharing

### What We Share

- **Rivalry opponent data** - Your tier lists and contest results are visible ONLY to your direct rivalry opponent (1-on-1 private rivalries)
- **Fighter statistics** - Aggregate, non-personal statistics about character performance may be visible to other users

### What We Don't Share

We do **NOT** share your personal information with:

- ❌ Third-party advertisers
- ❌ Business partners or affiliates
- ❌ Marketing companies
- ❌ Public leaderboards or social networks
- ❌ Any other users beyond your direct rivalry opponents

Your rivalries are private. There are no public profiles, forums, or community features where your data is displayed to the general user base.

## Data Security

We implement industry-standard security measures:

- Secure authentication via AWS Cognito with encrypted password storage
- HTTPS/TLS encryption for all data transmission
- AWS security infrastructure and compliance standards
- No storage of payment information (we don't process payments)

However, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.

## Your Rights and Choices

You have the right to:

- **Access your data** - Request a copy of your personal information
- **Update your data** - Modify your account information and tier lists within the app
- **Delete your data** - Request account deletion (contact us at the email below)
- **Withdraw consent** - Stop using the app at any time

## Children's Privacy

Rivalry Club does not knowingly collect information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.

## Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last Updated" date and, if applicable, through in-app notifications.

## No Purchases or Transactions

Rivalry Club currently does not include:

- In-app purchases
- Subscriptions
- Payment processing
- Advertising

If we add monetization features in the future, we will update this Privacy Policy accordingly and notify users.

## Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us at:

**Email**: jeremy@jeremymoritz.com

## Technical Details

For developers and technical users:

- **Authentication**: AWS Cognito (email/password)
- **API**: AWS Amplify GraphQL API
- **Storage**: AWS S3 for static assets
- **Platform**: React Native (iOS)
- **Data Model**: GraphQL schema with types for Game, Fighter, Rivalry, TierList, TierSlot, Contest, and User

---

This privacy policy is specific to the Rivalry Club mobile application and accurately reflects our current data collection and usage practices as of December 2025.
