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

## Crash Analysis & Debugging Reports

### crash_analysis.md
**Topic**: TestFlight iOS crash investigation - AWS Amplify v6 TurboModule incompatibility
**Summary**: Comprehensive analysis of 11+ TestFlight crash reports (builds 17-21) showing consistent iOS crashes within 1 second of app launch. Root cause identified as AWS Amplify v6 module import triggering React Native TurboModule void method exception bug. Documents all attempted fixes (delayed config, module-level init, 100ms delays) and critical discovery that even importing Amplify (without calling configure) causes crashes. Provides 4 solution paths including Amplify v5 downgrade (recommended), alternative auth providers, or React Native upgrade.
**Use when**: Debugging iOS crashes, investigating TurboModule errors, evaluating auth solutions, working with AWS Amplify, troubleshooting TestFlight issues
**Current Status**: Build 22 testing in progress - Amplify import completely removed to confirm diagnosis

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

### test-evaluation-summary.md ✅
**Topic**: Test evaluation for atomic increment implementation and stat tracking features
**Summary**: Complete test evaluation showing 18 new comprehensive tests created for atomic increments, diff-checking, position validation, and trackStats parameter. Documents 4 failing tests that were fixed: 3 were **improvements** (slotsPerTier now uses SSBU's actual 86-fighter structure), 1 was a mock structure issue (TierListEditDisplay now properly tests deselection UX). All new tests passing (18/18). All fixed tests passing (4/4). Includes detailed analysis of test coverage, quality metrics (100% feature coverage), and recommendations. Overall test success rate: **253/253 passing (100%)**.
**Use when**: Understanding test coverage for atomic increments, evaluating stat tracking tests, checking diff-checking optimization tests, validating position validation tests, reviewing test quality, understanding deselection UX behavior
**Status**: ✅ All Tests Passing (253/253) - Ready for Production
**Test Files**: `__tests__/models/m-tier-list.stats.test.ts` (18 new tests), `__tests__/models/m-tier-list.test.ts` (3 tests fixed), `TierListEditDisplay.test.tsx` (1 test fixed)
**Features Tested**: TierSlot stat tracking, trackStats parameter, diff-checking optimization, position validation (sparse/full mode), console log cleanup, deselection UX
**Verdict**: All failures were due to improvements or fixable mock issues. All features comprehensively tested and production-ready.

## Deployment & Infrastructure Reports (`deployment/`)

### SANDBOX_TO_PRODUCTION_MIGRATION.md
**Topic**: Complete guide for migrating Amplify Gen 2 sandbox to production environment
**Summary**: Comprehensive step-by-step migration plan for converting sandbox DynamoDB tables and Cognito users to production with zero data loss. Includes 5 phases (Backup, Deploy, Import, Cutover, Cleanup), complete scripts for exporting/importing data (handles 1000+ records), Cognito user migration with awsSub transformation, verification procedures, and rollback plans. Explains why Amplify Gen 2 sandbox cannot be directly promoted to production and why export/import is the safest approach. **CRITICAL: Handles awsSub mapping to ensure User table authentication links work correctly after Cognito migration.** Contains all necessary JavaScript scripts for automated migration.
**Use when**: Ready to deploy to production, converting sandbox to production, migrating databases, backing up Amplify data, understanding Amplify Gen 2 deployment models
**Data Volume**: Designed for large datasets (1000+ records)
**Prerequisites**: AWS CLI configured, appropriate IAM permissions, Node.js installed
**Estimated Time**: 1-2 hours total migration time
**See also**: `AWSSUB_CRITICAL_ISSUE.md` for detailed explanation of the authentication linkage problem

### AWSSUB_CRITICAL_ISSUE.md
**Topic**: Critical authentication issue during Cognito migration and how it's solved
**Summary**: Detailed explanation of why User table's awsSub field must be updated during migration when creating a new Cognito User Pool. Covers the problem (new Cognito pool = new sub values, but User table has old awsSub values = broken auth), the solution (create mapping between old→new subs and transform User records during import), and why this works (User IDs stay same, only awsSub updated, foreign keys intact). Includes data flow diagrams and verification steps.
**Use when**: Understanding the awsSub mapping requirement, debugging auth issues after migration, verifying User table migration worked correctly
**Key Insight**: Foreign keys use User.id (not awsSub), so updating awsSub doesn't break relationships. awsSub is solely for Cognito→User linkage.

### AMPLIFY_BUILD_FAILURE_NODE_VERSION.md
**Topic**: First Amplify production build failure - Node.js version incompatibility
**Summary**: Analysis and resolution of Amplify Gen 2 deployment failure caused by Node.js 16.19.0 (Amazon Linux 2 default) lacking APIs required by project dependencies (Node.js 18+ needed). Error: `addAbortListener` not found in `node:events` module. Fixed by creating `amplify.yml` configuration file and updating build image to Amazon Linux 2023 in AWS Console. Includes log analysis showing 100+ EBADENGINE warnings and final SyntaxError.
**Use when**: Amplify builds failing with Node.js errors, setting up Amplify deployment configuration, troubleshooting dependency version mismatches
**Resolution**: Create `amplify.yml` + switch to Amazon Linux 2023 build image
**Status**: Deployment #1 - Resolved, but revealed second issue

### AMPLIFY_BUILD_FAILURE_ESM_IMPORTS.md ⚠️ (INCORRECT - SEE TSCONFIG REPORT)
**Topic**: Second/third Amplify build failures - Incorrect ESM diagnosis
**Summary**: ⚠️ **This report contains an incorrect diagnosis.** Documents the attempted fix of adding `.js` extensions to imports, which did not resolve the issue. The real problem was a TypeScript configuration conflict (root tsconfig including amplify directory). Kept for historical reference showing the debugging process.
**Use when**: Understanding the debugging journey, learning from incorrect diagnoses
**Status**: Deployment #2/#3 - Incorrect fix, see `AMPLIFY_BUILD_FAILURE_TSCONFIG.md` for actual solution

### AMPLIFY_BUILD_FAILURE_TSCONFIG.md ⚠️ (PARTIAL FIX)
**Topic**: TypeScript configuration conflict (partial diagnosis)
**Summary**: ⚠️ **Partially correct but incomplete.** Correctly identified that root tsconfig should exclude amplify directory, but missed the core issue: `amplify/tsconfig.json` was using `moduleResolution: "bundler"` instead of `moduleResolution: "Node16"`. Exclusion was necessary but not sufficient. See `AMPLIFY_DEPLOYMENT_SUMMARY.md` for complete solution.
**Use when**: Understanding the debugging process, partial fixes
**Status**: Deployment #4 - Still failed, incomplete fix

### AMPLIFY_DEPLOYMENT_SUMMARY.md ✅ (COMPLETE SOLUTION)
**Topic**: Complete analysis of all 4 deployment failures and final solution
**Summary**: Comprehensive document covering all deployment attempts (1-4), their errors, attempted fixes, and the actual root cause. The real issue: `amplify/tsconfig.json` used `moduleResolution: "bundler"` (for Webpack/Vite) instead of `moduleResolution: "Node16"` (required by AWS Amplify Gen 2 CDK). Solution verified against AWS's official amplify-backend repository configuration. Includes complete before/after configs, research sources, debugging timeline (~3 hours), key learnings, and what didn't work.
**Use when**: Understanding the complete Amplify deployment journey, configuring Amplify Gen 2 TypeScript, debugging CDK Assembly failures, learning from debugging process
**Resolution**:
- Change `amplify/tsconfig.json` to use `module: "Node16"` and `moduleResolution: "Node16"`
- Add `.js` extensions to imports in `amplify/backend.ts`
- Keep `"exclude": ["amplify"]` in root tsconfig
**Status**: Deployment #5 - High confidence solution matching AWS official config
**Key Learning**: Always check official source code repositories for correct configuration; TypeScript type checks passing ≠ runtime success
**Research Sources**: [AWS amplify-backend tsconfig](https://github.com/aws-amplify/amplify-backend/blob/main/tsconfig.base.json)

## Legal & Compliance Documents

### PRIVACY_POLICY.md
**Topic**: Privacy policy for Rivalry Club mobile app
**Summary**: Accurate, mobile-specific privacy policy that reflects the actual data practices of the Rivalry Club app. Addresses issues from the generic template including web-focused language, non-existent features (purchases, business partners, affiliates), and unclear data sharing. Specifically mentions AWS Cognito, Amplify, and S3 as service providers. Clarifies that rivalries are private 1-on-1 (not public), and that there are no purchases, ads, or third-party data sharing. Written in plain language appropriate for App Store requirements.
**Use when**: Preparing for App Store submission, updating privacy documentation, responding to user privacy questions, legal compliance review
**Key Points**:
- Mobile app language (device type, screens viewed) instead of web language (browser type, pages visited)
- AWS service providers explicitly listed (Cognito, Amplify, S3)
- Removes false claims about purchases, business partners, and affiliates
- Clarifies private 1-on-1 rivalries (no public features)
- No third-party advertising or marketing
**Status**: Draft - needs contact email added before publication

## Code Quality & Development Guidelines

### REFACTORING_PREFERENCES.md
**Topic**: Project refactoring philosophy and guidelines
**Summary**: Documents when to refactor duplicate code vs. when to keep it explicit. Covers good refactoring (extract inline styles, magic numbers, complex logic) vs. bad refactoring (over-abstracting A/B rivalry patterns, premature extraction). Emphasizes readability over DRY principles. Includes the Rivalry Club A/B Pattern rule: User A and User B are distinct domain concepts, not array items—keep them separate and explicit for clarity.
**Use when**: Deciding whether to refactor duplicate code, reviewing code for readability, onboarding developers, evaluating pull requests, working with rivalry A/B structures
**Key Rules**:
- ✅ Extract: inline styles, magic numbers, complex calculations used 3+ times
- ❌ Don't extract: A/B parallel structures, one-off logic, code that's already clear
**Golden Rule**: Refactor for readability, not just to reduce line count

## Feature Implementation Reports

### atomic-increment-implementation.md ✅
**Topic**: Atomic increment operations for TierSlot and Fighter statistics using AppSync custom resolvers
**Summary**: Complete implementation of race-condition-free increment operations for `contestCount` and `winCount` fields using AWS AppSync JavaScript resolvers with DynamoDB's atomic `ADD` operation. Eliminates fetch-then-update patterns and removes need for Lambda functions. Includes custom mutations (`incrementTierSlotStats`, `incrementFighterStats`), TypeScript helper controllers, deployment to sandbox, integration points, performance analysis (AppSync vs Lambda comparison), and migration path from existing Lambda endpoint. Provides zero cold starts, no race conditions, and simpler infrastructure.
**Use when**: Incrementing contest statistics, resolving contests, updating fighter/tier slot win/loss counts, replacing Lambda endpoints, preventing race conditions, optimizing performance
**Status**: ✅ Implemented & Deployed to Sandbox (Production deployment pending)
**Key Files**: `amplify/data/resource.ts` (schema), `amplify/data/increment-tierslot-stats.js`, `amplify/data/increment-fighter-stats.js`, `src/controllers/c-increment-stats.ts`
**Integration Points**: `src/models/m-tier-list.ts` (adjustTierSlotPositionBySteps), `src/components/screens/ConnectedRivalryView.tsx` (handleResolveContest)
**Benefits**: Atomic operations, no Lambda costs, instant execution, type-safe, zero race conditions

### unknown_tier_implementation.md
**Topic**: Implementation guide for "Unknown Tier" feature
**Summary**: Comprehensive step-by-step guide for implementing nullable fighter positions (unknown tier) instead of random initial placement. Covers 16 incremental steps including critical fail-safe (data integrity check), backend logic (position calculation, collision handling, sampling), UI changes (visual unknown tier section, drag-and-drop), database updates, and testing. Includes position assignment formula (`enemyPosition ± result * 14`), tier computation logic (86 fighters ÷ 7 tiers), rollback plan, and progress tracking. Designed for incremental implementation with checkpoint updates to survive computer crashes.
**Use when**: Implementing unknown tier feature, understanding position assignment logic, debugging tier list behavior, working on contest resolution or re-shuffle functionality
**Status**: Planning Phase (1/16 steps complete - schema verified)
**Estimated Time**: 11-17 hours total
**Key Features**: Null position support, data integrity fail-safe, dynamic fighter positioning via contests, manual drag-and-drop positioning, tier fullness detection

---

**Note**: When generating new reports, add them to the appropriate subfolder and update this index with a brief entry following the format above.
