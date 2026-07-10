# NeuroFlow 3D Project Rules

## Stack

- Use the Node.js version pinned in `.node-version`; Angular 22 requires Node `22.22.3` or newer within the supported major.
- Use Angular 22 standalone components, TypeScript, RxJS, Three.js, and component-scoped SCSS.
- Use Angular signals for synchronous UI state and RxJS for existing asynchronous/data streams.
- Do not introduce a CSS framework, state library, backend, or translation API without an explicit requirement.

## Development

- Preserve the route, service, model, and data-driven simulation architecture.
- Keep user-facing English and Kannada copy in the local i18n layer. New visible text must use `TranslatePipe` and receive a natural Kannada translation.
- Preserve the accessible mobile navigation, language persistence, reduced-motion support, keyboard controls, and 320px minimum responsive behavior.
- Keep brain/scenario data in `public/assets/data`; do not hard-code domain data in components.
- Avoid fixed content widths. Use Grid/Flexbox, `minmax(0, 1fr)`, relative sizing, and the existing 1080/768/480 responsive tiers.
- Maintain visible focus states and approximately 44px touch targets for interactive controls.

## Verification

- Run `npm test -- --watch=false` after behavior changes.
- Run `npm run build` before completing work.
- Run `git diff --check` before committing.

## Deployment

- Cloudflare Pages serves `dist/neuroflow-3d/browser`.
- Keep `public/_redirects` so Angular deep links fall back to `index.html`.
- Keep deployment configuration in `wrangler.toml` aligned with Angular's output directory.
