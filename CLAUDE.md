# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **planning repository** for a Test Case Management System (TCMS) - a modern test management platform similar to TestRail. The repository currently contains only product requirement documents (PRD) and does not have any implemented codebase.

**Current Status**: Planning phase - no source code implementation exists yet.

## Repository Structure

- `claude/` - Contains product requirement documents in Korean
  - `claude.md` - Full PRD with detailed feature specifications, technical architecture, roadmap, and budget planning
  - `tcms-prd-summary.md` - Duplicate of the main PRD
- `src/` - Empty directory (reserved for future implementation)

## Product Vision

A TestRail-like platform targeting QA teams with:
- Test case management (CRUD, versioning, templates)
- Test execution tracking (planning, execution interface, result recording)
- Reporting and analytics (dashboards, coverage reports, trend analysis)
- Integrations (Jira, CI/CD pipelines, test automation frameworks, Slack/Teams)
- Collaboration features (comments, reviews, real-time editing)

## Planned Technical Architecture

### Frontend (Not Yet Implemented)
- Framework: React 18+ / Vue.js 3+
- Language: TypeScript
- State Management: Redux / Vuex
- UI Library: Material-UI / Ant Design

### Backend (Not Yet Implemented)
- Language: Node.js 18+ / Python 3.10+
- Framework: Express.js / FastAPI
- Architecture: Microservices
- API: RESTful + GraphQL

### Database (Not Yet Implemented)
- Primary: PostgreSQL 14+
- Caching: Redis 7+
- Search: Elasticsearch 8+
- File Storage: S3-compatible

### Infrastructure (Not Yet Implemented)
- Containers: Docker
- Orchestration: Kubernetes
- CI/CD: GitLab CI / GitHub Actions

## User Roles (Planned)

- **Admin**: Full system management
- **QA Manager**: Project management, test planning
- **QA Engineer**: Test case creation and execution
- **Developer**: Read and comment access
- **Viewer**: Read-only access

## Implementation Roadmap (Planned)

- **Phase 1 (1-3 months)**: MVP - Core test case management
- **Phase 2 (4-6 months)**: Integrations and advanced reporting
- **Phase 3 (7-9 months)**: Enterprise features (SSO, MFA, CI/CD)
- **Phase 4 (10-12 months)**: AI features (test recommendations, failure prediction)

## Working with This Repository

Since this is a planning repository with no code:

1. **To implement features**: Reference the detailed specifications in `claude/claude.md`
2. **To understand requirements**: Read the PRD sections on core features, technical specifications, and user roles
3. **To plan development**: Follow the 4-phase roadmap outlined in the PRD
4. **Language**: All documentation is in Korean

## Next Steps for Implementation

When beginning development, you would need to:
1. Initialize the chosen tech stack (React/Vue + Node.js/Python)
2. Set up database schemas for test cases, test runs, projects, and users
3. Implement authentication and RBAC
4. Create the core test case management CRUD operations
5. Build the test execution interface
6. Develop reporting and dashboard functionality
