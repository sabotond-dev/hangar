# HANGAR for ZONA
## Comprehensive GUI design specification

Design proposal · 9 September 2026 · Version 1

**Direction:** a precise, expressive instrument workspace. Graphite surfaces and an acid-yellow action color frame the light matrix. The surface is the center of attention; settings, device state, and recovery tools remain predictable.

This proposal interprets the seven screens in `hangar-redesign.pdf`, the preceding critique, and the primary-source research below. It is a design handoff, not a claim that the proposed features are already implemented or supported by ZONA firmware.

## 1. Product purpose and design principles

HANGAR helps musicians and visual performers discover ZONA configurations, explore what they do, adapt them, construct new layouts, and transfer a known version to the intended hardware page.

Primary jobs:

- **Discover:** find a configuration by what it does and how it feels.
- **Adapt:** understand and change a few meaningful settings while seeing the result.
- **Build:** compose a touch surface with an explicit relationship between regions, behavior, and output.
- **Perform:** try a gesture without accidentally moving its controls or rewriting the device.
- **Keep:** preserve a useful variation and know whether it exists in a draft, a library copy, or device memory.

Three principles govern the design:

1. **Show the relationship between action and result.** Selecting an element highlights its region and opens its properties. Changing a setting updates its preview. Device feedback names the destination and the applied revision.
2. **Make experimentation recoverable.** Keep drafts, provide undo, and distinguish destructive device operations from ordinary editing.
3. **Let complexity appear when it is useful.** Show essential behavior first; disclose detailed MIDI mapping, diagnostic logs, and advanced parameters on demand.

## 2. What research changed

| Evidence | Design consequence | Boundary |
|---|---|---|
| ZONA’s product page presents an XY surface with a 9 × 9 matrix and 0–1023 values per axis. [1] | Render one continuous input surface with a light-matrix overlay. Distinguish lighting cells from editable regions. | Exact zone geometry, touch count, sensing behavior, and firmware configuration schema require validation. |
| Intech Grid Editor uses left navigation, a central module layout, and a right configuration panel. It distinguishes applying changes from storing them permanently. [2] | Use the same spatial arrangement in both editors. Include separate draft, applied, and stored states. | Existing Grid behavior is a reference, not proof of ZONA’s transfer semantics. |
| Novation Components permits editing without a connected device and offers explicit connection state, configuration creation, and device transfer. [3] | Make disconnected browsing productive. Keep the connection control persistent and provide an explicit target before transfer. | Do not copy its device-specific capabilities or replacement behavior. |
| Ableton’s browser supports filtering, tags, and saved searches. [4] | Separate functional categories from descriptive tags. Preserve browse context and offer lightweight favorites. | Saved searches can follow the first release; six sample cards do not need an elaborate query builder. |
| Web MIDI has compatibility, secure-context, and permission requirements. [5] | Detect capabilities and distinguish unsupported browser, denied permission, and disconnected hardware. | ZONA’s actual transport must be established; do not assume Web MIDI is the configuration transport. |
| WCAG 2.2 requires alternatives to nonessential dragging and minimum target sizing with exceptions. [6,7] | Add click-to-place, numeric position/size fields, keyboard controls, and generous touch targets. | The prototype is not a completed accessibility audit. |
| MIDI defines channel numbering and the special meaning of controller numbers 120–127. [8,9] | Display channels as 1–16. Keep ordinary CC assignment distinct from channel-mode messages. | CC labels describe standard conventions, not guaranteed DAW assignments. |

## 3. Brand and visual direction

Retain HANGAR as the application identity and ZONA as the connected instrument. Use **HANGAR / for ZONA** in the shell. The supplied logo should be implemented from the original brand asset; the text wordmark in the interactive proposal is an approximation.

Keep:

- Dark, warm neutral surfaces.
- The bright yellow-green primary action color.
- Large matrix previews and expressive color within the instrument.
- Compact, practical typography with a technical character.

Refine:

- Replace strong borders around every subcontrol with restrained section dividers.
- Use solid surfaces rather than background photography inside the working application.
- Keep labels, values, and controls visually distinct.
- Reserve glowing or saturated color for the light output, active selection, and the primary action.
- Use textured imagery on an optional introduction screen; use crisp geometry while editing.

Avoid permanent animated card galleries, oversized reset actions, long uppercase instructions, low-contrast “disabled-looking” filter chips, and ambiguous icon-only controls.

## 4. Information architecture

### Main navigation

| Destination | Purpose | Primary content |
|---|---|---|
| Playground | Discover and adapt ready-made configurations | Search, filters, gallery, configuration workspace |
| Sandbox | Construct a custom surface | Element palette, surface, element inspector |
| My configs | Retrieve personal work | Drafts, named copies, favorites, import/export |

The connection button belongs in the global header. Help and device actions occupy stable secondary locations. A marketing introduction should never interrupt returning users; open their last workspace or Playground.

### Workspace hierarchy

Global shell → active draft → selected configuration or element → properties.

Device connection and target page are global context; inspector settings are local to the selected object. Saved copies remain distinct from the current editable draft.

Suggested routes for implementation:

- `/playground` — gallery; query/filter/sort encoded in navigation state.
- `/playground/:configurationId` — editable local variation of a preset.
- `/sandbox/:draftId` — surface editor.
- `/my-configs` — personal collection.
- `/share/:snapshotId` — immutable snapshot opened as an editable copy.

Do not require an account for exploration or local drafts. Account synchronization is a later capability if the product supports it.

## 5. Screen inventory

| ID | Screen or state | Main action | Secondary actions |
|---|---|---|---|
| P01 | Playground gallery | Explore configuration | Search, filter, favorite, sort |
| P02 | Filtered gallery | Open a result | Remove filter, clear all |
| P03 | No results | Clear filters | Edit search |
| P04 | Configuration workspace | Apply to ZONA | Preview, edit, save copy, share |
| P05 | Configuration Play mode | Interact with preview | Stop output, return to Configure |
| S01 | Sandbox empty | Add an element | Start from a template, import |
| S02 | Region selection | Choose element type | Change region, cancel |
| S03 | Sandbox selected element | Edit properties | Duplicate, delete, resize |
| S04 | Sandbox multi-selection | Edit shared properties | Align, distribute, duplicate group |
| S05 | Sandbox Play mode | Test controls | Return to Edit, stop output |
| L01 | My configurations | Open a copy | Rename, duplicate, export |
| L02 | Save variation | Save copy | Cancel |
| D01 | Connection panel | Connect or retry | Continue previewing |
| D02 | Apply review | Apply to named page | Cancel, inspect changes |
| D03 | Applied, not stored | Store on ZONA | Revert device preview if supported |
| D04 | Stored | Continue working | View destination details |
| D05 | Transfer failure | Retry after verification | Return to draft |
| D06 | Reset device page | Reset named page | Cancel, export current config if readable |
| H01 | Share snapshot | Create/copy link | Download configuration |
| H02 | Help | Contextual assistance | Shortcuts, connection troubleshooting |

The interactive proposal demonstrates the main gallery, generic configuration editor, populated and empty Sandbox, My configs, and connection/apply/save/share/help/reset dialogs. Multi-selection, real sharing, imports, device transport, and firmware execution are specified here but are not implemented in the mockup.

## 6. Playground design

### Layout

Use a slim collection rail on the left and a gallery on the right. Place a short title and one sentence above search; the interface should remain useful after this introduction is learned.

Desktop gallery cards contain:

1. A square light-matrix preview.
2. A clear configuration name and favorite control.
3. One functional category and one descriptive tag.
4. A one-sentence explanation of the gesture and result.
5. **Explore** as the main action.

Do not repeat a bright apply button on every card. A later expert quick-apply action may appear in a card menu once the device destination is explicit.

### Taxonomy

- **Use:** Modulation, Notes, Visual; add further categories only when the real catalog supports them.
- **Character:** Flowing, Rhythmic, Expressive, Atmospheric.
- **Personal:** Favorites, Recently used, My configurations.

These are proposed content categories. The real configuration schema should determine whether multiple categories and tags are allowed.

Search matches title, short description, and tags. Functional filters combine with text search. Display the actual matching count, selected filters, and a clear way to remove each filter. If no results remain, keep search visible and explain how to broaden it.

### Preview behavior

- Show a static, meaningful frame at rest.
- Animate only the selected or explicitly previewed card.
- Provide a visible preview action on touch devices.
- Pause animations when offscreen or when reduced motion is requested.
- Keep browser previews silent unless the user deliberately enables a supported sound or MIDI destination.
- Return to the previous scroll position, filters, and search after closing a configuration.

### Content

Arc, Aurora, and Chorus come from the PDF. Pulse, Orbit, and Drift are illustrative additions created for the design; they are not represented as shipping presets.

## 7. Configuration workspace

### Spatial structure

- Left: nearby configurations and Back to Playground.
- Center: configuration identity, Configure/Play switch, large continuous surface, coordinate readout, optional monitor.
- Right: selected configuration settings, grouped by task.
- Top: draft status, device destination, apply/store action.

At a 1440px desktop viewport, start with a 200px rail, a flexible center, and a 300px inspector. Use 24px center padding and size the surface to the available width and height, with a practical maximum around 600px. Inspectors may scroll independently in the production application while the preview and apply control remain visible.

### Parameter schema

Do not force all presets into identical settings. The interactive proposal uses a generic inspector to demonstrate layout; production must render settings from a validated schema.

| Configuration type | Essential properties | Advanced properties, only if supported |
|---|---|---|
| Modulation | Gesture behavior, movement rate, release response, output mapping | Curve, smoothing, phase, clock synchronization |
| Notes/chords | Root note, scale/chord selection, note range, MIDI channel | Voicing, inversion, velocity response, per-note expression |
| Visual | Pattern, palette, brightness, persistence | External trigger, synchronization, output mapping |

Use actual parameter names, limits, units, defaults, and dependencies from the configuration schema. Do not expose numerical concepts such as “Arms” without a clear meaning, visualization, and validated values.

### Controls

- Numeric stepper/input for exact MIDI values.
- Slider plus editable value for continuous settings.
- Segmented buttons for two or three meaningful alternatives.
- Select/combobox for larger enumerations.
- Swatch opens a color popover; exact value remains available.
- Changed fields gain a subtle marker and a per-field reset affordance.
- Disabled fields include a concise reason when the prerequisite is not obvious.

### Randomization

Label it **Randomize**. Default scope: appearance and compatible expressive behavior. Preserve MIDI destination, channel, routing, and device target. Provide **Undo randomize**; allow parameter locks only when the configuration has enough randomizable parameters to justify them.

### Apply and close

Closing the workspace preserves the draft. Saving creates a named snapshot. Applying affects the selected device page and must never be inferred from an ordinary parameter edit unless a separate live-edit mode is explicitly enabled.

## 8. Sandbox design

### Empty state

Show the actual touch surface with quiet light guides. Use direct instructions: **Add an element, or select an area on the surface.** Offer one visible starter action and a small template alternative. Remove the question-mark placeholder.

### Two creation paths

1. **Area first:** drag a rectangle, or click a start point and an end point; then choose a compatible element.
2. **Element first:** choose Fader, Button, Knob, or a supported additional type; then place its default region with a click.

Both paths converge on the same selected-element state. A proposed XY-pad element is useful for ZONA but needs confirmation against the supported element types.

### Surface representation

The light matrix and interaction regions are separate layers. A displayed 9 × 9 layout grid is a snapping aid, not a statement that touch is limited to 81 discrete positions. Store regions using the firmware’s supported coordinate representation; translate to normalized values for editing where appropriate.

Selected regions show an outline, a label, and handles. Unselected regions retain a visible boundary and name. Never make selection depend only on color.

### Inspector

Header: **Filter · Fader**, followed by region dimensions.

Sections:

1. Identity: name and type.
2. Geometry: position, width, height, orientation.
3. Behavior: parameters specific to the element type.
4. Output: message type, channel, controller/note, range.
5. Appearance: active/inactive colors, label visibility where supported.

Keep duplicate/delete accessible in a stable location. Deleting a region must be undoable.

### Geometry and conflicts

- Snap visibly; show proposed bounds before committing.
- Prevent off-surface geometry.
- Default to preventing overlaps. Explain the conflict at the affected region.
- If layered interactions are supported, make layer order and hit-testing explicit before enabling overlaps.
- Preserve the previous valid value when a numeric edit is invalid; keep an inline message until corrected.
- Duplicate to a free area and retain the original mapping. Highlight repeated MIDI assignments as informational unless they violate a real constraint.
- If no valid space exists, offer resize or another page; never silently delete an existing element.

### Edit versus Play

Edit changes selection and layout. Play routes gestures to the preview and locks structural editing. Use a persistent visible mode label and a clear return action. Switching modes must not lose selection or draft history.

Physical-device selection following should be optional if supported. Default to keeping the inspector stable; users can enable **Follow hardware selection** when useful.

## 9. Device and persistence model

Three distinct objects should exist conceptually:

- **Draft:** editable working state, automatically recovered locally when supported.
- **Saved copy:** a named snapshot that can be reopened or shared.
- **Device state:** the configuration confirmed on a specific device/page, including whether it is permanently stored.

Never use one generic “Saved” indicator for all three.

### Proposed state machine

| State | Visible label | Main action | Required behavior |
|---|---|---|---|
| No connection | Preview only | Connect ZONA | Browsing, editing, and saving remain available |
| Permission needed | Allow device access | Connect | Request only the permissions required by the selected transport |
| Permission denied | Device access blocked | Connection help | Explain how to retry without discarding work |
| Unsupported environment | Device connection unavailable here | Continue previewing | Offer current supported alternatives from capability detection |
| Ready | ZONA connected | Apply to ZONA | Show destination page and draft identity |
| Draft differs | Changes not applied | Apply to ZONA | Retain applied revision separately |
| Applying | Applying to Page N… | Disabled during transfer | Prevent duplicate writes; do not claim success on timeout |
| Applied temporarily | On device · not stored | Store on ZONA | Show how to retain the configuration after power-off |
| Storing | Storing on Page N… | Disabled during operation | Await acknowledgment supported by the protocol |
| Stored | Stored on ZONA · Page N | Continue editing | Record confirmed revision and destination |
| Transfer uncertain | Device state unverified | Verify/retry | Preserve draft and avoid implying an automatic rollback |
| Disconnected | Disconnected · draft retained | Reconnect | Stop live output; do not auto-apply on reconnect |

The two-stage Apply/Store behavior is a proposed model informed by Grid Editor. If ZONA provides an atomic persistent write, combine the actions into one **Apply to ZONA** operation while retaining precise progress and result labels. The handoff must resolve this before implementation.

### Destination review

Show device identity, page, configuration name, and what will be replaced. First use and destination changes require an explicit review. Experienced users may skip repetitive review for the same destination only when safe and clearly configured.

Do not assume a fixed number of pages. The four pages in the mockup are examples; production enumerates supported pages. If the protocol can only write the currently active page, show that as read-only and instruct the user to switch on hardware.

### Reset behavior

**Reset active device page** lives under Device actions and names the page in its confirmation. **Reset configuration settings** changes only the browser draft. **New surface** creates an empty draft with undo. Each action has different copy and effects.

## 10. Preview, output, and diagnostics

Keep **Browser preview**, **MIDI output**, and **Hardware application** distinct.

The light preview may be an approximation of firmware rendering. If it is approximate, label that in contextual help; do not claim that the browser is running the firmware.

Production preview modes:

- Visual preview: default; no external messages.
- MIDI audition: explicit destination and an enabled output switch, if supported.
- Hardware audition: transfer to a named device/page with clear persistence state.

An optional collapsed monitor shows timestamp, direction, source, channel, message, and value. Users can pause and clear the log. Aggregate or limit high-rate messages to keep the UI responsive. Preserve access to errors while avoiding an always-visible console.

When real note output is enabled, provide **Stop output** and release tracked active notes on mode changes, disconnects, and focus loss as appropriate. Exact handling must follow the supported transport and MIDI implementation.

## 11. My configurations and sharing

My configs distinguishes Recoverable drafts, Named copies, and Favorites. Default ordering should help users resume recent work. Each item shows a preview, title, configuration kind, and a truthful timestamp/status.

Save copy:

- Prefill a meaningful name and focus the name field.
- Validate empty names inline.
- Create a new snapshot; do not overwrite the source preset.
- Offer rename, duplicate, export, and deletion with undo where practical.

Share:

- Share an immutable snapshot with a compatible schema/version.
- Explain public/private visibility before link creation.
- Opening the link creates an editable copy.
- Subsequent source edits do not silently alter the shared result.
- Offer export/import when cloud links are unavailable.
- Validate imported schemas and show incompatibilities before opening or applying.

Actual persistence, import/export, and link creation are future implementation work. The interactive mockup only stores named copies in the current session and intentionally creates no real share links.

## 12. Design tokens

The companion `HANGAR-ZONA-design-tokens.css` provides the starting values.

| Token role | Value | Use |
|---|---|---|
| Workspace | `#101210` | Main background |
| Panel | `#191C18` | Rail and inspector |
| Raised | `#22261F` | Selected rows and secondary surfaces |
| Divider | `#383E32` | Decorative separation |
| Control boundary | `#758168` | Required input/control distinction |
| Primary text | `#F0F1E9` | Main labels and values |
| Secondary text | `#ACB3A2` | Helper text and metadata |
| Action/selection | `#DCFF71` | Main action and active outline |
| Text on action | `#19200D` | Readable action labels |
| Error text | `#FFC4AD` | Validation and transfer errors |
| Error surface | `#35211D` | Error messages |

Typography:

- Start with a neutral grotesk interface face; use the existing brand typeface if available and licensed.
- Prototype uses a local Arial/Helvetica fallback for portability.
- Production base: 14px/1.45 on desktop; editable touch fields 16px.
- Page title: 28–32px; panel title: 20px; group title: 14px; metadata: 12px.
- Use 11px only for short nonessential metadata or compact uppercase section labels.
- Tabular numbers for changing values and aligned numeric fields.
- Avoid uppercase paragraphs; use uppercase only for short navigation context and section labels.

Geometry:

- Spacing scale: 4, 8, 12, 16, 24, 32, 48px.
- Standard field/button height: 36px desktop, 44px coarse pointer.
- Control radius: 6px; small light cells: 2–3px; dialogs: 10px.
- Standard panel padding: 20–24px.
- Use one primary action per task area. Secondary controls use neutral fill/border; destructive controls are visually subordinate until confirmation.

## 13. Responsive behavior

| Width | Gallery | Editor | Inspector |
|---|---|---|---|
| 1440px and above | 3–4 columns, left rail | Persistent rail, large center, right inspector | 300–340px |
| 1024–1439px | 3 columns where card width permits | Compact rail and right inspector | 268–300px |
| 768–1023px | 2 columns | Collapsible rail; preserve a usable square surface | Side panel if space permits, otherwise below/drawer |
| Below 768px | 1–2 columns based on minimum card width | Focused surface and visible mode switch | Bottom sheet or separate Properties view |

On narrow screens, reflow device controls to a second header row. Keep connection and apply state visible. Do not shrink the whole desktop layout into a miniature view.

Use pointer capability, not viewport alone, to size touch targets. Numerical geometry remains a usable alternative when touch dragging is difficult. Support orientation changes without resetting work.

The inline proposal reflows its inspector below the surface at intermediate widths and stacks sections on mobile. Production should validate panel behavior with the actual app viewport and keyboard.

## 14. Accessibility and motion

- Target WCAG 2.2 AA, with a real audit before release.
- Validate text contrast at 4.5:1 for normal text and 3:1 for large text; verify essential non-text control boundaries and states at 3:1 where required. [10]
- Use semantic buttons, labels, regions, dialog names, and a logical focus order.
- Keep focus visible and unobscured by sticky bars or drawers.
- Use 44px effective touch targets as a product target; WCAG 2.2 AA’s minimum is 24px with specified exceptions. [7]
- Provide single-pointer alternatives to dragging, not just keyboard shortcuts. [6]
- Pair selection color with outlines, labels, and selected state semantics.
- Announce completed actions, selection changes, and errors; do not announce every MIDI event or animation frame.
- Trap focus within open dialogs and return it to the invoking control.
- Give the canvas a named region and accessible property controls. In production, add a spatial keyboard model and an element list so the surface is not the sole means of selection.
- Respect reduced motion; stop ambient preview loops and avoid flashing. Keep motion generated by instrument output controllable.

Motion is functional: 100–160ms hover/selection transitions and brief panel transitions. Avoid entrance animations that delay editing. Any firmware-driven visual behavior needs independent flashing and motion review.

## 15. Component inventory

| Component | Key variants/states |
|---|---|
| App header | Connected/disconnected; active section; narrow layout |
| Connection control | Ready, unavailable, denied, interrupted |
| Draft/device status | Draft, changed, applying, applied, storing, stored, uncertain |
| Library card | Rest, selected preview, favorite, incompatible |
| Search and filter | Empty, active, no results, loading/error |
| Surface renderer | Lights, region guides, selection, interaction preview |
| Region overlay | Default, selected, resizing, conflict, multi-selected |
| Element palette/list | Available, incompatible, selected, empty |
| Property field | Default, edited, invalid, disabled with reason, resettable |
| Numeric control | Typed value, stepper, limits, unit, validation |
| Color control | Swatch, open popover, exact value, reset |
| Mode switch | Configure/Edit, Play |
| Undo/redo controls | Available, unavailable, grouped operation |
| MIDI monitor | Collapsed, active, paused, empty, filtered, error |
| Save/share dialog | Input, validation, submitting, success, failure |
| Apply/reset dialog | Target review, progress, completion, failure |
| Toast/banner | Success, information, recoverable error, persistent blocking error |

Use shared components and token roles across Playground and Sandbox. Schemas should drive parameter controls and validation; avoid duplicating inspectors for every configuration.

## 16. Copy examples

| Situation | Copy |
|---|---|
| Disconnected | “Preview only. Connect ZONA when you’re ready.” |
| Draft edited | “Changes not applied” |
| Apply action | “Apply to ZONA” |
| Target review | “Replace the configuration on ZONA · Page 2?” |
| Temporary apply complete | “Applied to Page 2. Store on ZONA to keep it after power-off.” |
| Stored | “Stored on ZONA · Page 2” |
| Unknown transfer result | “The device stopped responding. Your draft is safe; device state could not be verified.” |
| Invalid region | “This region overlaps Filter. Choose another area or resize it.” |
| No results | “No configurations found. Try a different search or clear your filters.” |
| Saved copy | “Arc — my variation saved to My configs.” |
| Device reset | “Reset Page 2 to its firmware default? Your browser draft will remain available.” |

## 17. Implementation priorities

### First release

1. Persistent shell, capability-aware connection state, and accurate draft/device status.
2. Playground gallery with usable search, filters, favorites, and preserved browse context.
3. Shared configuration workspace with schema-driven controls and visual preview.
4. Sandbox creation, selection, position/size editing, validation, and undo/redo.
5. Local recovery, named copies, and validated import/export.
6. Explicit target review, transfer acknowledgment handling, and scoped reset.
7. Responsive and keyboard flows, plus a compact MIDI diagnostic view if supported.

### Subsequent improvements

- Immutable share links and optional cloud synchronization.
- Multi-selection and alignment tools.
- Parameter locks for randomization and configuration comparison.
- Optional hardware-follow selection.
- Saved searches once catalog size makes them useful.
- Live hardware editing only after transfer and recovery semantics are established.

Do not prioritize a community feed, ratings, complex analytics, or account onboarding ahead of the core configure/test/keep loop.

## 18. Validation plan

Evaluate the design with musicians who are new to ZONA and with experienced Grid/MIDI users. These are proposed acceptance tests, not completed research results.

1. Find a modulation configuration, preview it, change a setting, and return to the same gallery position.
2. Explain where a configuration currently exists: browser draft, saved copy, temporary device state, or permanent memory.
3. Build a fader and a button using only clicks and numeric fields; repeat with keyboard navigation.
4. Attempt an overlapping region and recover without losing the previous valid layout.
5. Enter Play mode, try a gesture, and return to editing the same element.
6. Apply to a different page and correctly identify the destination before writing.
7. Simulate disconnection during transfer; confirm that the draft is intact and the result is not falsely reported as successful.
8. Save, reopen, and export a variation; confirm exact parameters and layout remain intact.
9. Use the interface at 1440px, 1024px, 768px, and 375px, with zoom and a touch keyboard.
10. Check focus order, accessible names, contrast, reduced motion, and screen-reader announcements.

Success is accurate understanding and recoverable operation, not simply completing a transfer quickly. Collect task completion, errors, recovery behavior, and the user’s interpretation of each persistence state.

## 19. Open technical decisions

Resolve these with firmware/product owners before turning the proposal into a production implementation:

- Configuration transport, permissions, acknowledgments, and supported browsers.
- Whether Apply is temporary, persistent, or followed by a separate Store operation.
- Actual number and addressing of device pages; whether writes can target inactive pages.
- Region coordinate system, granularity, overlap rules, and supported element types.
- Supported preset parameters, MIDI message types, expression, and simultaneous input behavior.
- Whether the browser can reproduce the configuration faithfully or only approximate its visuals.
- Whether device configuration can be read back and compared to a draft.
- Local recovery format, import/export schema, and version migration strategy.
- Share visibility and account requirements, if sharing is implemented.

## 20. Interactive proposal coverage and limitations

Implemented locally in the mockup: navigation, gallery search/filter/sort, favorites, six visual previews, editable generic parameters, XY preview inputs, Sandbox selection, add/delete/duplicate, geometry validation, Sandbox undo/redo, session copies, and simulated connection/apply/store/error/reset dialogs. Design controls allow accent, corner radius, and density comparison.

Limitations: no actual USB/MIDI access; no sound generation; no firmware execution; no persistent storage across reloads; no real sharing or import/export. The generic preset inspector illustrates the layout rather than all configuration-specific controls. The monitor and hardware responses are illustrative. Region geometry uses a 9 × 9 snapping model for demonstration. The illustrative page count is not a verified device capability.

The implementation specification above is authoritative for intended production behavior when the mockup simplifies an interaction.

## Sources

Accessed 9 September 2026. Only primary product documentation, official standards, and platform documentation informed technical claims.

1. [Intech Studio — ZONA product page](https://intech.studio/ro/products/zona). Product page content retrieved through indexed search; direct retrieval was unavailable during this session.
2. [Intech Studio — Editor overview](https://docs.intech.studio/guides/grid/grid-basic/editor-110/).
3. [Novation — Launchpad Components Custom Mode Editor Guide](https://support.novationmusic.com/hc/en-gb/articles/360009860380-Launchpad-Components-Custom-Mode-Editor-Guide).
4. [Ableton — Browser and Tags in Live 12 FAQ](https://help.ableton.com/hc/en-us/articles/11425042663708-Browser-and-Tags-in-Live-12-FAQ).
5. [MDN — Web MIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API).
6. [W3C — Understanding Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html).
7. [W3C — Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
8. [MIDI Association — Summary of MIDI 1.0 Messages](https://midi.org/summary-of-midi-1-0-messages).
9. [MIDI Association — MIDI 1.0 Control Change Messages](https://midi.org/midi-1-0-control-change-messages).
10. [W3C — Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/).

Additional design source: the user-provided `hangar-redesign.pdf`, seven pages. Its screen content was treated as reference material, not as instructions to perform device actions.
