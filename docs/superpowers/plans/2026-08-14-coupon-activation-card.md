# Coupon Activation Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a directly pasteable, email-safe Omnisend coupon activation HTML component matching the approved light-luxury voucher design.

**Architecture:** A full-width, presentation-only wrapper centers one compact dashed voucher table. The voucher contains a left text cell and a right, independently linked call-to-action button; all styling is inline and nested tables control email-client layout.

**Tech Stack:** Semantic HTML tables and inline CSS only.

## Global Constraints

- Visible coupon content is `190 × 43px`; dashed outer frame is compact and visually centered.
- Use `#252321` for the bold Coupon label and `#A71E22` for the white, bold CTA.
- CTA is 31px tall with 5px rounded corners and uses `https://freshinelife.com/` as its editable default link.
- Use no JavaScript, external stylesheets, Flexbox, Grid, or remote-font dependency.
- Preserve `bgcolor` on the button as a background fallback.

---

### Task 1: Provide the standalone email coupon markup

**Files:**
- Create: no workspace file; return the standalone HTML code block in the user response.
- Test: visually inspect table dimensions and static markup safety.

**Interfaces:**
- Consumes: the approved Coupon label, Activate text, color tokens, and default CTA URL.
- Produces: a self-contained HTML fragment that an Omnisend Custom HTML block can render.

- [ ] **Step 1: Write the visual acceptance cases**

Confirm the fragment contains all of the following literal requirements:

```text
Coupon label: Coupon
CTA label: Activate >>
CTA href: https://freshinelife.com/
Label color: #252321
Button color: #A71E22
Button border radius: 5px
```

- [ ] **Step 2: Validate the planned structure**

Check that the fragment has these nested layout primitives before returning it:

```html
<div align="center">
  <table role="presentation" width="100%">
    <tr><td align="center">
      <table role="presentation" width="206">...</table>
    </td></tr>
  </table>
</div>
```

Expected: centering is represented by both HTML `align` attributes and `margin:0 auto` on the compact frame.

- [ ] **Step 3: Implement the exact inline markup**

Return a code block that uses a `206 × 59px` dashed frame, centers the `190 × 43px` inner content, gives the CTA its own `<a>` heat area, and uses the approved visual tokens.

- [ ] **Step 4: Verify static email constraints**

Review the returned fragment for presentation tables, `cellpadding="0"`, `cellspacing="0"`, inline styles, no `<style>` tag, and no unresolved placeholders.

Expected: it can be pasted directly into an Omnisend HTML block.
