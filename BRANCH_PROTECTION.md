# Branch Protection Rules for FoodRater

This document defines the branch protection rules that should be configured for the FoodRater repository.

## 🛡️ Main Branch Protection

### Required Rules
- **Require pull request before merging**: Yes
- **Require approvals**: 1 approval
- **Dismiss stale reviews when new commits are pushed**: Yes
- **Require status checks to pass before merging**: Yes
- **Required status checks**:
  - `code-quality` (from CI workflow)
  - `convex-validation` (from CI workflow)
  - `build-verification` (from CI workflow)

### Restrictions
- **Who can push**: Only administrators
- **Who can bypass**: Only administrators
- **Require branches to be up to date**: Yes

## 🔀 Develop Branch Protection

### Required Rules
- **Require pull request before merging**: Yes
- **Require approvals**: 1 approval
- **Required status checks**: All CI jobs must pass

### Restrictions
- **Who can push**: Maintainers and administrators
- **Bypass restrictions**: Only administrators

## 📋 Required Checks

### CI/CD Status Checks
All of the following must pass before merging:

1. **code-quality** - ESLint, TypeScript, security checks
2. **convex-validation** - Backend schema and type safety
3. **build-verification** - Expo build configuration
4. **dependency-check** - License and security validation

### Additional Requirements
- **Commits must be signed** (optional but recommended)
- **Linear history** (no merge commits, use rebase)
- **PR description required** (enforced by PR workflow)

## 🚨 Branch Creation Rules

### Allowed Branch Patterns
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency production fixes
- `release/*` - Release preparation

### Protected Branches
- `main` - Production code
- `develop` - Development integration

## 🔐 Repository Rules

### Push Restrictions
- **No direct pushes to main/develop** - Must use PRs
- **Branch deletion** - Only after PR merge
- **Force push** - Disabled on main/develop

### Pull Request Rules
- **Auto-delete head branches** after merge
- **Allow auto-merge** - Disabled for security
- **Update branches** - Allowed for contributors

## 📊 Enforcement

### CI/CD Integration
- **Block merges if CI fails** - All checks must pass
- **Automated notifications** - On build failures
- **Status checks visible** - In PR timeline

### Override Capabilities
- **Admin override** - Available for emergencies
- **Emergency bypass** - Documented override process
- **Audit logging** - All overrides tracked

---

## 🎯 Implementation Checklist

To implement these rules via GitHub UI or API:

- [ ] Enable branch protection on `main`
- [ ] Enable branch protection on `develop`
- [ ] Configure required status checks
- [ ] Set up required reviewers
- [ ] Configure allowed branch patterns
- [ ] Enable automatic branch deletion
- [ ] Set up CI/CD integration
- [ ] Configure admin permissions
- [ ] Test protection rules
- [ ] Document override procedures

**Note**: These rules should be configured in GitHub repository settings under "Settings → Branches"