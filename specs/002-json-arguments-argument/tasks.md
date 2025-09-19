# Tasks: Authenticated Proxy Art Generation

**Input**: Design documents from `/specs/002-json-arguments-argument/`
**Prerequisites**: plan.md (required), spec.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Vue.js 3, Vercel Functions, existing encryption system
   → Structure: Frontend + API (web application)
2. Load specification from spec.md:
   → Replace dual-panel UI with single canvas art generation
   → Add favicon integration from subscription URLs
   → Maintain steganographic disguise of authentication
3. Generate tasks by category:
   → Setup: project refactoring, dependencies
   → Tests: contract tests, integration tests
   → Core: art generation, favicon fetching, canvas rendering
   → Integration: authentication disguise, error handling
   → Polish: performance optimization, final validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Create parallel execution examples
7. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Frontend**: `src/` at repository root
- **API**: `api/` at repository root
- **Tests**: Create test directories as needed

## Phase 3.1: Setup & Refactoring
- [ ] T001 Create test directory structure with `tests/unit/`, `tests/integration/`, `tests/contract/`
- [ ] T002 [P] Install testing dependencies (Vue Test Utils, Vitest, @vue/test-utils)
- [ ] T003 [P] Configure Vitest for Vue.js testing in `vite.config.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test for art generation with valid auth in `tests/contract/test_authenticated_generation.test.ts`
- [ ] T005 [P] Contract test for art generation with invalid auth in `tests/contract/test_unauthenticated_generation.test.ts`
- [ ] T006 [P] Contract test for favicon fetching API in `tests/contract/test_favicon_fetch.test.ts`
- [ ] T007 [P] Integration test for steganographic parameter handling in `tests/integration/test_auth_disguise.test.ts`
- [ ] T008 [P] Integration test for canvas art rendering with favicons in `tests/integration/test_canvas_favicon.test.ts`
- [ ] T009 [P] Unit test for art parameter validation in `tests/unit/test_art_params.test.ts`

## Phase 3.3: Backend Implementation (ONLY after tests are failing)
- [ ] T010 [P] Create favicon fetching service in `api/utils/favicon.ts`
- [ ] T011 [P] Create art generation utility functions in `api/utils/art.ts` 
- [ ] T012 Refactor `api/generate.ts` to include favicon integration and art generation logic
- [ ] T013 Add base64 favicon encoding in favicon service
- [ ] T014 Implement steganographic failure mode handling in `api/generate.ts`

## Phase 3.4: Frontend Core Implementation
- [ ] T015 [P] Create art parameter types in `src/types/art.ts`
- [ ] T016 [P] Create canvas art generation service in `src/services/artGenerator.ts`
- [ ] T017 [P] Create favicon display component in `src/components/FaviconDisplay.vue`
- [ ] T018 Create single-canvas art component in `src/components/ArtCanvas.vue`
- [ ] T019 Refactor `src/components/ParamParseTest.vue` to use single input + canvas layout
- [ ] T020 Implement copy-to-clipboard functionality for config files in art canvas

## Phase 3.5: Integration & Authentication Disguise
- [ ] T021 Integrate favicon fetching with art generation in `src/services/artGenerator.ts`
- [ ] T022 Implement visual indicators for authentication success in canvas art
- [ ] T023 Add silent degradation for authentication failures
- [ ] T024 Implement parameter validation that disguises auth as art controls
- [ ] T025 Add error handling that maintains artistic facade

## Phase 3.6: Polish & Validation
- [ ] T026 [P] Performance optimization for canvas rendering (<2s generation time)
- [ ] T027 [P] Add loading states and animations for art generation
- [ ] T028 [P] Unit tests for art generation utilities in `tests/unit/test_art_utils.test.ts`
- [ ] T029 Validate steganographic requirements - no obvious auth hints in UI
- [ ] T030 Final integration test with complete user flow in `tests/integration/test_complete_flow.test.ts`
- [ ] T031 Manual testing with various favicon sources and auth combinations

## Dependencies
- Setup (T001-T003) before tests (T004-T009)
- Tests (T004-T009) before implementation (T010-T025)
- Backend (T010-T014) before frontend integration (T021-T025)
- Core frontend (T015-T020) before integration (T021-T025)
- Implementation before polish (T026-T031)

## Key Dependency Chains
- T010 (favicon service) → T013 (base64 encoding) → T021 (frontend integration)
- T015 (types) → T016 (art service) → T018 (canvas component)
- T017 (favicon component) → T020 (copy functionality)
- T019 (UI refactor) depends on T018 (canvas component)

## Parallel Example
```
# Launch T004-T009 together (all test files):
Task: "Contract test for authenticated art generation in tests/contract/test_authenticated_generation.test.ts"
Task: "Contract test for unauthenticated art generation in tests/contract/test_unauthenticated_generation.test.ts"
Task: "Contract test for favicon fetching in tests/contract/test_favicon_fetch.test.ts"
Task: "Integration test for auth disguise in tests/integration/test_auth_disguise.test.ts"
Task: "Integration test for canvas favicon in tests/integration/test_canvas_favicon.test.ts"
Task: "Unit test for art params in tests/unit/test_art_params.test.ts"

# Launch T010-T011 together (different backend files):
Task: "Create favicon fetching service in api/utils/favicon.ts"
Task: "Create art generation utilities in api/utils/art.ts"

# Launch T015-T017 together (different frontend files):
Task: "Create art parameter types in src/types/art.ts"
Task: "Create canvas art generation service in src/services/artGenerator.ts" 
Task: "Create favicon display component in src/components/FaviconDisplay.vue"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify all tests fail before implementing
- Maintain steganographic disguise throughout implementation
- Preserve existing encryption/authentication system
- Canvas must display meaningful art regardless of auth status
- Commit after each task completion

## Task Generation Rules Applied

1. **From Specification**:
   - UI refactoring → canvas component tasks (T018-T020)
   - Favicon integration → favicon service tasks (T010, T013, T017)
   - Authentication disguise → integration tasks (T021-T025)
   
2. **From Current Architecture**:
   - Vue.js frontend → component and service tasks
   - Vercel Functions API → API utility tasks
   - Existing encryption → preserve and extend tasks
   
3. **From Testing Requirements**:
   - TDD approach → contract and integration tests first
   - Steganographic validation → specialized test scenarios

## Validation Checklist
- [x] All major features have corresponding tests
- [x] All new components have dedicated tasks
- [x] Tests come before implementation
- [x] Parallel tasks are truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Steganographic requirements addressed in testing
- [x] Existing authentication system preserved and extended