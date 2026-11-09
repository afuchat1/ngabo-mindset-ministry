<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Place photos inside aspect-ratio wrappers with absolutely positioned, cover-fitted images so native image dimensions cannot change the layout.
- Import site photos as bundled local image files so photo delivery does not depend on the preview asset proxy; retain existing CDN pointers for earlier deployments.
- Store event announcements in Supabase with time-window public read policies and protected user_roles; all management server functions verify the caller's role using the user-scoped client so private schedules cannot leak.
- Schedule announcement visibility in Africa/Kampala time and persist UTC timestamps; enforce dates and safe links in both server validation and database triggers.
- Keep one root auth transition listener and function bearer middleware; admin pages live under the client-only authenticated layout because sessions are browser-owned.
