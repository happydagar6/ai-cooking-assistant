# 🤝 Contributing to CookAI

First off, thank you for considering contributing to CookAI! It's people like you that make CookAI such a great tool for home cooks.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- A Supabase account
- A Clerk account
- An OpenAI API key

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
```bash
git clone https://github.com/your-username/cooking-assistant.git
cd cooking-assistant
```

3. **Install dependencies**:
```bash
npm install
```

4. **Set up environment variables**:
```bash
cp .env.local.example .env.local
# Edit .env.local with your actual values
```

5. **Run the development server**:
```bash
npm run dev
```

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Specify your browser and device information**

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### 🔧 Code Contributions

#### Types of Contributions We're Looking For:

- **Bug fixes** - Help us squash those pesky bugs!
- **Feature implementations** - Bring new ideas to life
- **Performance improvements** - Make CookAI faster and smoother
- **UI/UX enhancements** - Improve the user experience
- **Documentation** - Help others understand and use CookAI
- **Tests** - Increase our code coverage and reliability
- **Accessibility improvements** - Make CookAI usable for everyone

## 🛠️ Development Guidelines

### 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable React components
│   ├── ui/                # Base UI components
│   └── ...                # Feature-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and services
├── store/                 # Zustand store configuration
└── styles/                # Global styles and CSS
```

### 🎨 Style Guidelines

#### JavaScript/React

- Use **functional components** with hooks
- Follow **React best practices** (useCallback, useMemo for optimization)
- Use **TypeScript** for type safety where applicable
- Keep components **small and focused**
- Use **descriptive variable names**

#### CSS/Styling

- Use **TailwindCSS** utility classes
- Follow **mobile-first** responsive design
- Maintain **consistent spacing** and typography
- Use **semantic color names** from the design system

#### File Naming

- Use **kebab-case** for file names: `recipe-card.jsx`
- Use **PascalCase** for component names: `RecipeCard`
- Use **camelCase** for functions and variables: `getUserRecipes`

### 🧪 Testing

- Write **unit tests** for utility functions
- Include **component tests** for UI components
- Add **integration tests** for API routes
- Maintain **minimum 80% code coverage**

### 📱 Browser Support

Ensure your changes work on:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)

### ♿ Accessibility

- Use **semantic HTML** elements
- Include **proper ARIA labels**
- Ensure **keyboard navigation** works
- Maintain **good color contrast**
- Test with **screen readers**

## 🔄 Pull Request Process

### Before Submitting

1. **Create a feature branch**: `git checkout -b feature/amazing-feature`
2. **Make your changes** following our guidelines
3. **Test thoroughly** on multiple browsers/devices
4. **Run the linter**: `npm run lint`
5. **Update documentation** if needed
6. **Write or update tests** as necessary

### PR Requirements

- **Clear title and description** explaining the changes
- **Link to related issues** using keywords (e.g., "Fixes #123")
- **Include screenshots** for UI changes
- **Update README** if adding new features
- **Ensure all tests pass**
- **Get approval** from at least one maintainer

### PR Template

```markdown
## 📝 Description
Brief description of changes

## 🔗 Related Issue
Fixes #(issue number)

## 🧪 Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## 📱 Device Testing
- [ ] Desktop Chrome
- [ ] Mobile Safari
- [ ] Mobile Chrome

## 📸 Screenshots
(If applicable)

## 📋 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

## 📝 Commit Message Guidelines

Use the conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types:
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples:
```bash
feat(voice): add new voice command for ingredients list
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
style(components): format recipe card component
```

## 🎯 Getting Help

- **Discord**: Join our community chat
- **Issues**: Use GitHub issues for bug reports and feature requests
- **Email**: Contact us at developers@cookai.app
- **Documentation**: Check our comprehensive docs

## 🏆 Recognition

Contributors will be:
- **Listed** in our README contributors section
- **Featured** in our release notes
- **Invited** to our contributors Discord channel
- **Credited** in the app's about section

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

## 🙏 Thank You!

Your contributions make CookAI better for everyone. Whether you're fixing a typo or adding a major feature, every contribution is valuable and appreciated!

**Happy Coding!** 🍳✨