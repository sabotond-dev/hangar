<!--
  /sandbox/ - creates or resumes (13-16; Bible section 8; KEEP-01). The nav's SANDBOX lands here.
  With a sandbox draft in the store the effect goes to the newest one; with none, or with `?new` (My
  configs' `New surface`), it mints a surface id and goes to an empty surface under it; with
  `?from=<record id>` (a copy's `Open`, 13-17) it mints an id and carries the query on, so the copy
  stays a copy. /sandbox/[draftId]/ is where every surface is edited; this page holds no editor.
  The navigation replaces this entry in the history, so Back from the editor is Back to where the
  visitor came from. The prerendered document shows the frame and one quiet line (ledgered).
  Decided at 13-16 / 13-17; see .planning/phases/13-gui-overhaul/13-17-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { browser } from "$app/environment";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import {
    EYEBROW_SANDBOX,
    OPENING_LINE,
    STATUS_LINE,
    TITLE,
  } from "$lib/sandbox/copy";
  import { mintSurfaceId } from "$lib/sandbox/draft";
  import { readDrafts } from "$lib/store/drafts";
  import type { LocalStore } from "$lib/store/local";
  import { fillShell } from "$lib/ui/shell/shell.svelte";

  const BREADCRUMB = ["SANDBOX"];

  /** The route's edge to the browser store, one per route (13.2-CONTEXT D-15). */
  function local(): LocalStore | undefined {
    if (!browser) return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  /** The newest sandbox draft's surface id, or undefined. */
  function newestSurface(): string | undefined {
    let newest: { source: string; editedAt: string } | undefined;
    for (const draft of Object.values(readDrafts(local()))) {
      if (draft.kind !== "sandbox") continue;
      if (newest === undefined || draft.editedAt > newest.editedAt) {
        newest = draft;
      }
    }
    return newest?.source;
  }

  onMount(() => {
    const from = page.url.searchParams.get("from");
    const fresh = page.url.searchParams.has("new") || from !== null;
    const id = (fresh ? undefined : newestSurface()) ?? mintSurfaceId();
    void goto(
      from === null
        ? resolve("/sandbox/[draftId]", { draftId: id })
        : resolve(`/sandbox/${id}/?from=${encodeURIComponent(from)}`),
      { replaceState: true },
    );
  });

  $effect(() =>
    fillShell({
      variant: "app",
      section: "sandbox",
      breadcrumb: BREADCRUMB,
      status: STATUS_LINE,
    }),
  );
</script>

<svelte:head>
  <title>{TITLE}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="opening" data-testid="sandbox-opening">
  <p class="eyebrow type-micro">{EYEBROW_SANDBOX}</p>
  <p class="line type-base">{OPENING_LINE}</p>
</section>

<style>
  .opening {
    padding: 32px 24px;
    color: var(--color-ink);
  }

  .eyebrow {
    margin: 0 0 12px;
    color: var(--color-ink-quiet);
  }

  .line {
    margin: 0;
    color: var(--color-ink-quiet);
  }
</style>
