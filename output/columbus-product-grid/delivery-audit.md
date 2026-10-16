# Product grid delivery
Selection 57:1393; output HTML email component. Source: source/0_0.html.
User attachment is authoritative for products and URLs. Title changed to Upgrade Your Home in Style; collection CTA changed to EXPLORE CURTAINS. Existing subtitle and four product CTA labels retained.
Design styling adapted to email tables: warm white #FBFAF8, Lora500 title, Montserrat500 body, charcoal text, centered captions, portrait cards253.5×317, 20px column gap, outlined CTA.
Original four discount badges retained despite absent in reference. Source has no prices, none invented. Background image cover cropping differs from original square cards by design.
## Data verification
All13 href occurrences (including VML) identical to attachment. Four image URLs unchanged. All data-freshine slot names retained. All slot copy except specified title and collection CTA identical.
## Per-file export cleanup
| File | Category | Found | Replaced/removed | Retained |
|---|---|---|---|---|
| source/0_0.html | Resource entries | 8 | 7 localized successfully | 1 unavailable font |
| source/0_0.html | Node IDs | 0 | 0 | 0 |
| source/0_0.html | Generated class tokens | 37 | 37 paired renames | 0 |
Missing font asset undefinedundefined returned HTTP415 both in resource-fetch and manual curl retry. Archival export retains unresolved relative font reference; production component has no temporary or missing asset URL. Preview loads Lora and Montserrat; email uses system fallbacks when not supplied by host.
Decorative crop/badge wrappers retained to preserve source visual layering. Clear title role changed to heading with preserved weight.
## Local checks
Table nesting passed. 600px canvas height1070; 375px canvas height674.75; all four image downloads decoded and no horizontal overflow. Reviewed both screenshots. Small proportional height difference on mobile comes from text line boxes.
Not tested in Omnisend or inbox; min()/background/VML/client fonts require platform validation. EXPLORE CURTAINS points to original Roman Shades collection because link preservation was requested.

