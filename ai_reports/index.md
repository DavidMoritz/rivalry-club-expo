# AI Reports Index

This directory contains technical reports and documentation generated during development. Consult this index when working on related tasks.

## Authentication Reports (`auth/`)

### BRANCH_COMPARISON.md
**Topic**: Authentication solution comparison for TurboModule crash
**Summary**: Detailed comparison between AWS Cognito (production-ready) and AsyncStorage (dev-only) solutions for fixing expo-secure-store timing crashes. Includes security analysis, deployment considerations, and migration strategies.
**Use when**: Debugging auth crashes, choosing auth providers, security reviews

### AMPLIFY_GEN2_SETUP.md
**Topic**: AWS Amplify Gen 2 configuration guide
**Summary**: Complete setup guide for Amplify Gen 2 with TypeScript-based configuration, sandbox environments, and CI/CD pipelines. Covers data schema, authentication setup, and GraphQL API usage.
**Use when**: Setting up Amplify, configuring auth, working with GraphQL schema

## GraphQL & Debugging Reports

### GRAPHQL_DEBUG.md
**Topic**: GraphQL contest query debugging
**Summary**: Guide for testing contest queries in Postman, including endpoint configuration, query examples, and console log interpretation for identifying sorting/ordering issues.
**Use when**: Debugging GraphQL queries, investigating data ordering issues, testing API endpoints

## Testing & Quality Assurance Reports

### TEST_SUITE_OVERVIEW.md
**Topic**: Comprehensive test suite analysis and reference
**Summary**: High-level summary of the multi-agent test suite analysis located in `__tests__/`. Includes current status (100% passing, 248/248 tests), quality scorecard (9.5/10), major achievements (26 failing tests fixed), and navigation guide to 10+ detailed test reports. References Jest configuration fixes, async pattern analysis, and infrastructure improvements that reduced execution time by 71%.
**Use when**: Writing tests, debugging test failures, understanding test infrastructure, onboarding new developers, making Jest configuration changes, checking test health status
**See also**: `__tests__/READ_ME_FIRST.md`, `__tests__/FINAL_TEST_REPORT.md`, `__tests__/TEST_DOCUMENTATION_INDEX.md` for detailed analysis

---

**Note**: When generating new reports, add them to the appropriate subfolder and update this index with a brief entry following the format above.
