# Flexible Campaign Structure Design

## Goal

Allow a Campaign Draft to use exactly the registered, interaction-ready component sequence supplied by the user, without prescribed slots, component count, required components, or terminal component position.

## Current Context

`组件清单.json` is the single source of truth for the moved component directories. The existing Campaign Draft Skill and its structure validator still model six required, ordered slots and make `footer.warm` terminal. This conflicts with the requested sequence: `hero.countdownOverlay`, `collection.saleGrid6`, `image.clickableFullWidth`, `image.benefitsStrip3`, `gift.rewardGrid2`, `footer.warm`.

## Design

### Flexible structure contract

Replace the fixed `slots` contract with a versioned flexible contract. It declares that the user-provided component list is authoritative for order and membership. The contract must not list required component keys, prescribed slot IDs, terminal components, or cardinality constraints.

### Selection and validation

At Campaign assembly time, parse each requested `componentKey` in the user-provided order. Permit it only when it is both registered in `组件清单.json` and present in `campaign-component-interactions.v1.json`. Resolve every component path through the registry and verify its schemas, defaults, styles, and `效果演示.html`. Repeated registered component keys are permitted because the user controls membership and order.

The validator verifies the flexible-contract shape, validates every registry entry and interaction as before, and confirms that each interaction-ready component is registered. It must not require a hero, sale grid, linked image, gift, location card, footer, or any fixed order.

### Campaign conversation

Collect Campaign metadata and shared colors first. Then show one real `效果演示.html` per requested component, collect or load that component's complete snapshot, show its desktop and approximately 375px preview, and obtain the component confirmation before moving to the next requested component. Do not offer a fixed style-card sequence or a six-slot summary.

### Preserved safety gates

This change only removes structural constraints. The generated email must still use static safe HTML, include `[[unsubscribe_link]]`, produce desktop and mobile local previews, bind final approval to the complete HTML hash, and create or update only an Omnisend Campaign in `draft` status. It must never send, schedule, publish, or perform Shopify writes. Each selected component continues to follow its own interaction contract.

## Files and Tests

- Update `skills/build-omnisend-campaign-draft/SKILL.md` and `references/workflow-and-safety.zh-CN.md` to describe user-directed flexible sequencing.
- Replace the fixed-slot representation in `references/campaign-structure.v1.json` and update `scripts/validate-campaign-contracts.mjs` accordingly.
- Preserve `references/campaign-component-interactions.v1.json` as the selection gate, adding an entry only if a requested registered component lacks one.
- Update contract tests to assert that the validator accepts the flexible structure and rejects malformed flexible contracts, while retaining all delivery and read-only safety tests.
- Add a composition-level test for the requested six-component order to prove that the existing deterministic builder can render it from complete snapshots.

## Error Handling

Stop before preview generation when a requested component is absent from the registry, lacks an interaction contract, or has missing/mismatched registered files. Preserve the project draft and report the component key and failed resource. Do not silently substitute another component or reorder the list.

## Verification

Run the focused contract and builder tests, run `validate-campaign-contracts.mjs`, validate the edited skill with `quick_validate.py`, and generate local desktop/mobile previews for the requested composition. No Omnisend write occurs without the later, hash-bound final confirmation.
