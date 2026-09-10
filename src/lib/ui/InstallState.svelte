<!--
  Region 3's install blocks: the thirteen states and the one line of `writing`
  (07-UI-SPEC, The install state machine I1-I13; I14 and A-50; SAFE-07,
  SAFE-08, DEGR-02).

  One component renders whichever block the install store's phase names -
  six success-shaped (a caption over a body) and seven failure-shaped,
  the latter through Phase 6's FailureBlock so the panel and the header cannot
  word a failure differently or set it in two type scales. It reads the store
  and the session, authors no sentence (every string and every builder is
  install-copy's), and renders NO CONTROL: DISCONNECT ZONA in the `ready`
  block is Phase 4's, unchanged, and the panel renders it after this component
  exactly where it always has - a state block is not a tab stop, which is the
  same rule FailureBlock keeps. `idle` renders nothing at all; the panel
  renders Phase 6's blocks for the session's own states then.

  Two props, both for blocks written before or without a click: `name` is the
  chosen entry's name (the store's own `name` is what it was handed at the
  click and wins when it exists), and `label` is the rendering surface's
  control, TRY ON DEVICE here, for lostBlock's "Click ... again" step (Y-13).

  WHY `writing` HOLDS THE PREVIOUS BLOCK (I3, rule 4). A RAM leg is roughly
  40 ms end to end. Region 3 does not swap a reason line, a caption or a body
  for a state that lasts two frames: a sentence that appears and disappears
  inside 40 ms is noise rather than information, and the disabling of the
  three controls is protective rather than explanatory. So the last
  non-writing phase is held in a local, updated from an effect whenever the
  phase is anything but `writing`, and `writing` renders that phase's block
  under aria-busy="true" so assistive technology knows the block is about to
  change. The one exception is honest rather than decorative: a put-back's
  STORE leg (action `put-back`, leg `store`) shows the RESTORED caption and
  first line, because by then both RAM acknowledgements are in and the owner's
  own scripts genuinely are back in memory (I5's interval). The put-back's RAM
  leg, before any acknowledgement, has restored nothing and takes the held
  block like every other leg. RESTORED's second line - the power-cycle claim -
  waits for `restored` proper, and renders there only when the leg that
  landed was the store leg (D-12).

  THE FACTORY DEFAULT BLOCK, AND WHY ITS BODY MAY NAME A CONTROL (I14, A-50).
  `cleared` is a state of its own rather than a collapse into `settled` or
  `restored`, because after a clear neither of those sentences is true and the
  `restored` one is actively unsafe - a panel reading RESTORED tells a visitor
  not to click the one control that would actually restore them. The caption
  names the STATE, as PLAYING NOW does, not the button. The body names PUT
  BACK, and the copy rule is that no string names a control that is not on the
  screen: in `cleared` PUT BACK is present AND enabled, by construction, since
  a snapshot in hand is a term of CLEAR's own enablement rule. install.spec.ts
  asserts that pairing over the store rather than leaving it to a reading.

  WHICH FAILURE FORM A CLEAR TAKES. A clear reuses three of the seven blocks
  and authors none. `nothing-landed` takes Phase 7's PUT BACK form, whose
  detail - nothing on the module changed, so what was playing is still playing
  - is exactly true of a failed clear, and whose step names PUT BACK, which is
  on the screen. The selector is therefore `action === "try"` rather than
  `action === "put-back"`, which mirrors the store's own #classify (A-28) and
  makes `keep` and `clear` take the same side as `put-back` instead of falling
  through to the try form by omission. `lost` needs no selector: a clear has
  no store leg, so `storeLeg` is false and the honest half of lostBlock is the
  one that renders. `partial` has no forms at all - SAFE-07's sentence about
  half a configuration is true of a half-landed clear word for word.

  Nothing here animates a height. A block swap fades 160ms of opacity, CSS
  only, by remounting the block under {#key}; instant under reduced motion.
  The 2000 ms line beneath any block is the store's `slow`, a setTimeout on
  the store and never a timer here (Z-09).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install, type InstallPhase } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CLEARED_BODY,
    CLEARED_CAPTION,
    IDENTIFIED_CAPTION,
    KEPT_CAPTION,
    KEPT_PROOF_LINE,
    RESTORED_BODY,
    RESTORED_CAPTION,
    RESTORED_STORED_LINE,
    SETTLED_CAPTION,
    SNAPSHOTTING_BODY,
    SNAPSHOTTING_CAPTION,
    STILL_WRITING_LINE,
    identifiedBody,
    keptBody,
    keptMismatchBlock,
    lostBlock,
    nothingLandedBlock,
    partialBlock,
    restoredUnconfirmedBlock,
    settledBody,
    snapshotFailedBlock,
    unconfirmedBlock,
  } from "$lib/device/install-copy";
  import FailureBlock from "./FailureBlock.svelte";

  let {
    name,
    label,
  }: {
    /** The chosen entry's name, for a block rendered before the store was handed one. */
    name: string;
    /** The rendering surface's control label, interpolated into lostBlock's steps (Y-13). */
    label: string;
  } = $props();

  const writing = $derived(install.phase === "writing");

  /**
   * The last phase that was not `writing`. See the header for why region 3
   * keeps rendering it through a write. Written from an effect on the phase
   * and read by `shown`; the effect never reads it, so there is no loop.
   */
  let held = $state<InstallPhase>("idle");
  $effect(() => {
    if (install.phase !== "writing") held = install.phase;
  });

  /** The RESTORED interval of a put-back: its store leg, after both RAM acknowledgements. */
  const restoring = $derived(
    writing && install.action === "put-back" && install.leg === "store",
  );

  /** Which block is on screen: the phase, or during a write the held one. */
  const shown: InstallPhase = $derived(writing ? held : install.phase);

  /** The store's name from the click, else the entry's. */
  const shownName = $derived(install.name ?? name);
  const identity = $derived(session.identity);
</script>

{#if restoring || shown !== "idle"}
  <div
    class="install-state"
    data-testid="install-state"
    aria-busy={writing ? "true" : undefined}
  >
    {#key restoring ? "restoring" : shown}
      <div class="block">
        {#if restoring}
          <p class="caption">{RESTORED_CAPTION}</p>
          <p class="body">{RESTORED_BODY}</p>
        {:else if shown === "snapshotting"}
          <p class="caption">{SNAPSHOTTING_CAPTION}</p>
          <p class="body">{SNAPSHOTTING_BODY}</p>
        {:else if shown === "ready"}
          {#if identity}
            <p class="caption">{IDENTIFIED_CAPTION}</p>
            <p class="body">
              {identifiedBody(identity.zona.firmware, identity.activePage)}
            </p>
          {/if}
        {:else if shown === "settled"}
          <p class="caption">{SETTLED_CAPTION}</p>
          <p class="body">{settledBody(shownName)}</p>
        {:else if shown === "restored"}
          <p class="caption">{RESTORED_CAPTION}</p>
          <p class="body">{RESTORED_BODY}</p>
          {#if install.leg === "store"}
            <p class="body quiet">{RESTORED_STORED_LINE}</p>
          {/if}
        {:else if shown === "kept"}
          <p class="caption">{KEPT_CAPTION}</p>
          <p class="body">{keptBody(shownName)}</p>
          <p class="body quiet">{KEPT_PROOF_LINE}</p>
        {:else if shown === "cleared"}
          <p class="caption">{CLEARED_CAPTION}</p>
          <p class="body">{CLEARED_BODY}</p>
        {:else if shown === "kept-mismatch"}
          <FailureBlock block={keptMismatchBlock()} />
        {:else if shown === "unconfirmed"}
          <FailureBlock block={unconfirmedBlock(shownName)} />
        {:else if shown === "restored-unconfirmed"}
          <FailureBlock block={restoredUnconfirmedBlock()} />
        {:else if shown === "nothing-landed"}
          <FailureBlock
            block={nothingLandedBlock(
              install.action === "try" ? "try" : "put-back",
            )}
          />
        {:else if shown === "partial"}
          <FailureBlock
            block={partialBlock(
              install.landed ?? "The page init and the Timer",
              install.failed ?? "the Setup",
            )}
          />
        {:else if shown === "lost"}
          <FailureBlock block={lostBlock(install.leg === "store", label)} />
        {:else if shown === "snapshot-failed"}
          <FailureBlock block={snapshotFailedBlock()} />
        {/if}
      </div>
    {/key}

    {#if install.slow}
      <p class="body quiet slow">{STILL_WRITING_LINE}</p>
    {/if}
  </div>
{/if}

<style>
  /* A block swap is 160ms of opacity and nothing else (07-UI-SPEC, Motion). */
  .block {
    animation: fade-in 160ms linear;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* Micro, uppercase, quiet: every state caption (07-UI-SPEC, Color). */
  .caption {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* Body role at full strength: what the visitor is here to read. */
  .body {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .caption + .body,
  .body + .body {
    margin-block-start: 8px;
  }

  .quiet {
    color: var(--color-ink-quiet);
  }

  /* The 2000 ms line sits beneath whatever block is showing. */
  .slow {
    margin-block-start: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    .block {
      animation: none;
    }
  }
</style>
