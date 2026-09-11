## Description
<!-- Briefly describe the changes introduced in this PR and the problem being solved. -->

## Type of Change
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Refactor / Tooling / CI/CD
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Database / Prisma Checklist
- [ ] Does this PR modify `backend/prisma/schema.prisma`?
  - [ ] Migration generated (`npx prisma migrate dev --name <migration_name>`)
  - [ ] Migration checked into `backend/prisma/migrations/`
  - [ ] Seed script (`prisma/seed.ts`) updated if new models/relations were added
- [ ] No database schema changes in this PR

## Environment Variables
- [ ] Requires new/updated environment variables in `.env` or GitHub Secrets:
  <!-- List any new environment variables required -->
- [ ] No environment variable changes required

## UI / Frontend Changes
<!-- Include before/after screenshots or recordings for any UI changes. If none, write N/A. -->
- Screenshots / Recordings:

## Verification & Testing
- [ ] Backend typecheck passes (`npm run typecheck` in `backend/`)
- [ ] Backend test suites pass (`npm test` in `backend/`)
- [ ] Frontend typecheck passes (`npm run typecheck` in `frontend/`)
- [ ] Frontend build passes (`npm run build` in `frontend/`)
- [ ] Zero comments rule (`//`, `/*`, `/**`) verified across source files
