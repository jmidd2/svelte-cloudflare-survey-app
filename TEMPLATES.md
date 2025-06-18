# GitHub Templates

## Pull Request Template

<!-- .github/pull_request_template.md -->

## Description

Brief summary of changes and the issue(s) they address.

Fixes # (issue number)

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/formatting changes
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvements
- [ ] 🧪 Tests

## Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this change in a browser
- [ ] I have tested the mobile responsive design (if applicable)

## Database Changes

- [ ] No database changes required
- [ ] Database migration included and tested
- [ ] Database migration is backward compatible
- [ ] Seed data updated (if applicable)

## Security Considerations

- [ ] No security implications
- [ ] Security review completed
- [ ] Authentication/authorization changes reviewed
- [ ] Input validation added/updated
- [ ] SQL injection prevention verified

## Documentation

- [ ] Code is self-documenting/comments added where necessary
- [ ] Documentation updated (README, API docs, etc.)
- [ ] Environment variables documented (if new ones added)

## Deployment Notes

- [ ] No special deployment requirements
- [ ] Environment variables need to be set
- [ ] Cloudflare configuration changes required
- [ ] Third-party service configuration needed

## Screenshots/Videos (if applicable)

<!-- Add screenshots or videos to help explain your changes -->

## Additional Notes

<!-- Any additional information that reviewers should know -->

---

# Bug Report Template

<!-- .github/ISSUE_TEMPLATE/bug_report.md -->

---
name: 🐛 Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

A clear and concise description of what actually happened.

## Environment

- **Browser**: [e.g. Chrome 120, Safari 17]
- **Device**: [e.g. Desktop, iPhone 15, Android]
- **OS**: [e.g. macOS 14, Windows 11, iOS 17]
- **URL**: [e.g. https://your-app.com/survey/example]

## Error Details

<!-- Include any error messages, console logs, or stack traces -->

```
Paste error messages here
```

## Screenshots/Videos

<!-- If applicable, add screenshots or videos to help explain your problem -->

## Additional Context

<!-- Add any other context about the problem here -->

## Possible Solution

<!-- If you have ideas on how to fix this, please share -->

---

# Feature Request Template

<!-- .github/ISSUE_TEMPLATE/feature_request.md -->

---
name: ✨ Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement, needs-discussion
assignees: ''
---

## Feature Summary

A clear and concise description of what you want to happen.

## Problem/Motivation

Is your feature request related to a problem? Please describe.
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution

A clear and concise description of what you want to happen.

## Alternative Solutions

A clear and concise description of any alternative solutions or features you've considered.

## User Stories

<!-- Describe how this feature would be used -->

- As a [user type], I want [goal] so that [benefit]
- As a [user type], I want [goal] so that [benefit]

## Acceptance Criteria

<!-- Define what "done" looks like for this feature -->

- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

## Technical Considerations

<!-- Any technical details, dependencies, or constraints -->

- Database changes required: Yes/No
- Breaking changes: Yes/No
- Third-party services needed: Yes/No
- Performance impact: Low/Medium/High

## Design/Mockups

<!-- Include any design mockups, wireframes, or examples -->

## Priority

- [ ] Critical (blocking)
- [ ] High (important)
- [ ] Medium (nice to have)
- [ ] Low (someday/maybe)

## Additional Context

Add any other context or screenshots about the feature request here.

---

# Security Issue Template

<!-- .github/ISSUE_TEMPLATE/security.md -->

---
name: 🔒 Security Issue
about: Report a security vulnerability (use responsibly)
title: '[SECURITY] '
labels: security, priority-high
assignees: ''
---

## ⚠️ Security Issue Notice

If this is a **critical security vulnerability**, please do not file a public issue. Instead:

1. Email us directly at [security@yourcompany.com]
2. Use our responsible disclosure policy
3. Allow 90 days for remediation before public disclosure

## Vulnerability Type

- [ ] Authentication bypass
- [ ] Authorization issues
- [ ] SQL injection
- [ ] XSS (Cross-site scripting)
- [ ] CSRF (Cross-site request forgery)
- [ ] Information disclosure
- [ ] Other: ___________

## Severity Assessment

- [ ] Critical (immediate risk)
- [ ] High (significant risk)
- [ ] Medium (moderate risk)
- [ ] Low (minimal risk)

## Affected Components

<!-- Which parts of the application are affected? -->

- [ ] Authentication system
- [ ] Survey creation/management
- [ ] Data submission
- [ ] Admin dashboard
- [ ] Database
- [ ] Other: ___________

## Vulnerability Description

<!-- Provide a clear description of the vulnerability -->

## Steps to Reproduce

<!-- Detailed steps to reproduce the security issue -->

## Impact Assessment

<!-- What could an attacker achieve with this vulnerability? -->

## Proof of Concept

<!-- Include evidence (screenshots, code, etc.) but be responsible -->

## Suggested Mitigation

<!-- If you have ideas for fixing this, please share -->

## Environment Details

- Application version/commit:
- Environment: [staging/production]
- Browser/tool used: