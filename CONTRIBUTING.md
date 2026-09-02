# Contributing to FoodRater

Thank you for your interest in contributing to FoodRater! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Convex account ([convex.dev](https://convex.dev))
- iOS: Xcode 14+ and Mac with Apple Developer Tools
- Android: Android Studio and Android SDK

### Initial Setup
1. **Fork and clone** the repository
2. **Install dependencies**: `cd foodraterts && npm install`
3. **Set up environment**: Copy `.env.example` to `.env.local` and configure
4. **Start development server**: `npm start`

## 📋 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development and integration
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Emergency production fixes

### Development Process
1. **Create branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Follow our coding standards
3. **Test locally**: Run through the feature thoroughly
4. **Commit**: Use clear commit messages
5. **Push**: `git push origin feature/your-feature-name`
6. **Create PR**: Fill out the PR template completely

### Code Standards
- **TypeScript**: Strict mode enabled, proper typing required
- **ESLint**: Follow existing linting rules
- **Style**: React Native + Expo patterns
- **Comments**: Document complex logic and public APIs
- **Testing**: Write tests for new features

## 🔧 Development Guidelines

### Frontend (React Native + Expo)
- Use Expo Router for navigation
- Follow React Native best practices
- Implement proper error handling
- Use TypeScript for all components
- Test on multiple platforms (iOS, Android, Web)

### Backend (Convex)
- Use proper schema validation with `v.objects()`
- Implement authentication checks where needed
- Handle errors gracefully
- Write clear function documentation
- Use `query`, `mutation`, `action` appropriately

### UI/UX Guidelines
- Follow existing design system
- Maintain consistent spacing and colors
- Use accessible color contrasts
- Test on different screen sizes
- Implement proper loading states

## 🧪 Testing

### Required Testing
- **Manual Testing**: Test all user flows
- **Platform Testing**: iOS, Android, Web
- **Edge Cases**: Network errors, offline mode, empty states
- **Performance**: Monitor app performance impact

### Test Coverage Goals
- New features: Include manual testing plan
- Bug fixes: Verify the fix doesn't break existing functionality
- Breaking changes: Provide migration guide

## 📝 Commit Message Format

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add password reset functionality
fix(tweets): prevent duplicate like notifications
docs(readme): update installation instructions
```

## 🔄 Code Review Process

### Before Submitting
- Run `npm run lint` and fix any issues
- Test your changes thoroughly
- Update documentation if needed
- Check for TypeScript errors: `npx tsc --noEmit`
- Review your own changes first

### During Review
- Respond to review comments promptly
- Make requested changes in a timely manner
- Ask for clarification if needed
- Be open to suggestions

### After Approval
- Squash commits if needed
- Ensure your branch is up to date
- Wait for CI/CD checks to pass
- Celebrate your contribution! 🎉

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try to reproduce the bug
3. Gather environment details
4. Collect screenshots/error logs

### Report Format
Use our bug report template with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

## ✨ Feature Requests

### Request Format
Use our feature request template with:
- Problem statement
- Proposed solution
- UI/UX considerations
- Priority assessment
- Alternative solutions

## 📚 Documentation

### When to Update Docs
- New features added
- Breaking changes introduced
- Installation process changes
- Configuration updates
- API changes

### Documentation Types
- **README.md**: Project overview and quick start
- **CLAUDE.md**: Development guidelines
- **CHANGELOG.md**: Version history
- **Code comments**: Complex logic explanation

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and constructive
- Welcome new contributors
- Focus on what is best for the community
- Show empathy towards other community members

### Communication
- Use clear, professional language
- Assume good intentions
- Ask for help when needed
- Share knowledge freely

## 🎯 Priority Labels

- **priority**: Critical for next release
- **enhancement**: Nice to have features
- **bug**: Issues that need fixing
- **good first issue**: Great for new contributors
- **help wanted**: Community contributions welcome

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in relevant documentation
- Invited to become maintainers (for significant contributions)

## 📞 Getting Help

### Resources
- GitHub Issues: For bugs and feature requests
- GitHub Discussions: For questions and ideas
- Documentation: Check existing docs first
- Team: Tag maintainers for urgent issues

### Support Channels
- Open a GitHub Discussion
- Tag team members in issues
- Check existing issues and discussions

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to FoodRater!** 🎉🍔✨