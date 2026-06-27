# Node 001: Workflow and product planning baseline

## Goal
Establish BeerRank's AI product engineering workflow baseline and first MVP feature spec.

## Background
BeerRank is a new product. Before implementation, the project needs a shared product definition, scope, data shape sketch, and node plan.

## Scope
- Import MingMing AI Product Engineering Loop structure.
- Fill project intake.
- Create product, roadmap, architecture placeholder, module placeholder, API placeholder, database placeholder, design-system placeholder, and flow placeholder docs.
- Draft the first feature spec.
- Draft development nodes.

## Out of Scope
- Writing application code.
- Finalizing database schema.
- Creating visual designs.
- Choosing final production infrastructure.

## Inputs
- `docs/intake.md`
- `docs/product.md`
- `docs/product-roadmap.md`
- `tasks/current/feature-spec.md`
- User-provided brief in this conversation.

## Allowed Files
- `ai-workflow/`
- `docs/`
- `skills/`
- `tasks/`
- `.gitignore`

## Forbidden Changes
- Do not add app runtime dependencies.
- Do not create database migrations.
- Do not implement UI screens.

## Tasks
1. Copy workflow baseline into the project.
2. Fill BeerRank project intake.
3. Create product and roadmap docs.
4. Draft MVP feature spec with acceptance criteria and data shape sketch.
5. Draft node list and current node status.

## Quality Gates
1. Product definition is clear.
2. In scope and out of scope are both explicit.
3. Acceptance criteria are testable.
4. Data shape sketch includes entities, fields, relationships, lifecycle, and existing data impact.
5. Open questions are listed instead of hidden.

## Tests
Document review only. No runtime tests because no application code exists yet.

## Review Checklist
Use `ai-workflow/review-checklist.md`; focus on scope clarity, missing data concepts, and hidden implementation assumptions.

## Output
- Updated `docs/intake.md`.
- Created core `docs/*.md` planning files.
- Updated `tasks/current/feature-spec.md`.
- Updated `tasks/current/nodes.md`.
- Updated `tasks/current/node-status.md`.

## Handoff
Next: flow-designer, then system-architect and data-modeler.
