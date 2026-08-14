# Task 1 Report: Responsive CSS Safety

## Files changed

- `build-email-template.v1.mjs`
  - Added a component-keyed responsive CSS validator for `product.sampleStyle1`.
  - Allows exactly one un-attributed `<style>` block containing only the scoped `@media only screen and (max-width:375px)` rule and the three allowlisted class declarations.
  - Preserves the existing forbidden-tag and forbidden-CSS checks for all other components and all non-allowlisted markup/CSS.
- `tests/build-email-template.v1.test.mjs`
  - Added an allowlist acceptance test and a rejection test for a non-allowlisted declaration.

## Verification

- `node --test --test-name-pattern='product style1 responsive' tests/build-email-template.v1.test.mjs`
  - PASS: 1 test.
- `git diff --check`
  - PASS.
- `node --test`
  - PASS: 101 tests, 0 failures.

## Commit

`f4852e2a8dcef32aca12b9b0a74d42675e328135` (this commit)

## Concerns

The allowlist intentionally requires the exact three style1 mobile selectors and declarations expected by the responsive implementation. Any additional selector, declaration, at-rule, style attribute, or style block is rejected.
