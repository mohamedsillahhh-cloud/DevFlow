# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (current) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately by opening a
[GitHub Security Advisory](https://github.com/mohamedsillahhh-cloud/DevFlow/security/advisories/new).

**Do not report security vulnerabilities through public GitHub issues.**

Please include as much information as possible:
- Type of vulnerability
- Steps to reproduce
- Affected versions
- Potential impact

You should receive a response within 48 hours. If the issue is confirmed, a fix
will be released as soon as possible depending on complexity.

## Security Practices

- All frontend code runs client-side; sensitive operations should use Supabase RLS policies
- API keys in `.env` are never committed to the repository
- The `anon key` is the only key exposed to the frontend
- Service role keys are restricted to backend/CLI scripts
- CSP and security headers are configured in `vercel.json`
