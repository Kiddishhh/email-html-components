# Refined Warm Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return a paste-ready Omnisend footer HTML fragment with the existing Freshine information in a more legible warm-brand layout.

**Architecture:** One full-width, warm-brown presentation table contains one 440px content table. Content is grouped into brand, contact, social, legal, and unsubscribe sections using inline spacing tables; existing URLs and social-image sources are preserved verbatim.

**Tech Stack:** HTML presentation tables and inline CSS only.

## Global Constraints

- Preserve all existing copy, support email, address, telephone number, social URLs and the `[[unsubscribe_link]]` token.
- Use `#652A0D` background, white text, and `#F4D8A7` underlined links.
- Use 440px maximum content width, 24px horizontal and 32px vertical outer padding.
- Use no div, script, external CSS, Flexbox, Grid, or untested Omnisend token changes.

---

### Task 1: Return refined footer markup

**Files:**
- Create: no workspace implementation file; deliver the exact HTML fragment in the response.
- Test: static inspection of structure, fixed content, links, social image URLs and unsubscribe token.

**Interfaces:**
- Consumes: current `footer.warm` fixture values and the approved refined-footer specification.
- Produces: one standalone HTML fragment suitable for an Omnisend Custom HTML block.

- [ ] **Step 1: Define static acceptance checks**

Confirm the final fragment includes:

```text
Freshine Curtains
43 Corporate Park
support@freshinelife.com
https://www.instagram.com/freshinecurtains/
https://www.pinterest.com/freshinecurtains/
https://www.youtube.com/@freshinecurtains/shorts
https://www.tiktok.com/@freshinecurtains
[[unsubscribe_link]]
```

- [ ] **Step 2: Construct the email-safe hierarchy**

Use this root pattern:

```html
<table role="presentation" width="100%">
  <tr><td align="center">
    <table role="presentation" width="440">...</table>
  </td></tr>
</table>
```

Expected: every layout section uses table, tr, td and inline styling.

- [ ] **Step 3: Apply the approved visual hierarchy**

Render five groups in this order: brand title; address/contact; social icons; copyright/legal text; underlined unsubscribe link. Use the exact colors, font sizes, and spacing from `2026-08-14-refined-warm-footer-design.md`.

- [ ] **Step 4: Verify output safety**

Inspect that the response has no unresolved template variables, no style tags, no JavaScript, all four 24px social images include alt text, and the exact unsubscribe token is retained.

Expected: the fragment is directly pasteable into Omnisend, subject to platform preview verification.
