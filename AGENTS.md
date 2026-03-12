# AGENTS.md (todo-list-pwa)

## Skill Routing
For this repository, apply skills by task type:
- UI/UX, styling, layout, theme, modal/list/calendar visual behavior: use `toss-ui`.
- API/backend/data/auth/notification route logic: use `todo-backend`.
- Git push, release, production deployment, rollout verification: use `todo-deploy`.

## Required Reference Files (UI)
Before editing UI-related code, reference files in this order:
1. `C:/Users/user/.codex/skills/toss-ui/references/source-map.md`
- Use this as the index and open only the downstream files needed for the task.
2. `C:/Users/user/.codex/skills/toss-ui/references/mobile-tablet-patterns.md`
- Required when the task affects responsive behavior, phone/tablet UI, bottom sheets, sticky CTA, touch density, or safe-area handling.
3. `C:/C-Projects/toss_style_folder/toss_style_system.md`
- Core Toss-inspired principles, tokens, responsive layout matrix, and component rules.
4. `C:/C-Projects/toss_style_folder/TAILWIND_THEME_GUIDE.md`
- Tailwind application patterns, responsive recipes, and component usage guidance.

Open the following implementation files only when exact token names or concrete wiring are needed:
- `C:/C-Projects/toss_style_folder/tailwind.todo.toss.preset.cjs`
- `C:/C-Projects/toss_style_folder/tailwind.v4-theme.css`
- `C:/C-Projects/toss_style_folder/todo-toss-theme.css`
- `C:/C-Projects/toss_style_folder/tailwind-recipes.todo.tsx`
- `C:/C-Projects/toss_style_folder/tailwind.config.example.ts`

## Implementation Policy
- Prefer token-driven UI changes over one-off style patches.
- Work mobile-first. Do not start from desktop assumptions and shrink afterward.
- Treat tablet as an expanded mobile experience before introducing extra columns or desktop-style navigation.
- Keep light/dark mode parity for visual updates.
- Keep existing behavior unless request explicitly changes behavior.
- If responsive behavior changes, verify both mobile and tablet layouts before closing.
- Validate with `npm run build` after code changes.

## Release Default
- Unless the user explicitly says not to deploy, treat completed `todo-list-pwa` work as `build + production deploy + brief verification`.
- Use `todo-deploy` for this flow and prefer `npx vercel --prod` after a successful build.
- Report the production URL and what was verified after deployment.
- If unrelated dirty changes make commit/push unsafe, do not block deployment; note that deploy was done from the current local state without a clean release commit.
- If the task is clearly documentation-only or repository-guidance-only, deployment is not required.

## Scope Trigger
Apply these rules when tasks involve:
- CSS/Tailwind/theme tokens
- Component visual redesign
- Responsive mobile/tablet shells, sticky CTA, bottom sheets, or modal adaptation
- Modal/list/calendar/form visual behavior
- Typography/spacing/color/radius/shadow/motion updates

Backend-only tasks should use `todo-backend`.
Release/deploy tasks should use `todo-deploy`.
