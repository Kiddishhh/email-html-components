# Cropped sale banner

Selection229:3872. HTML source saved, screenshot inspected. Component email.html and standalone effect-preview.html.

Image1200×900 scales to600×450; viewport600×355 starts24px down image. CSS background-position25.263158% reproduces24/(450-355). CSS multiply overlay uses #7A6A60 at48%, image layer normal.

Campaign Lora18/23 medium; offer Lora48/61 regular; extra offer Montserrat14/21 medium; CTA183×40 at208.5,241, Montserrat16/600. CTA sale URL retains omnisend/email/cover-rc.

## Source cleanup
|File|Category|Found|Replaced/removed|Retained|
|---|---|---|---|---|
|source/0_0.html|Resource entries|4|3 localized|1 failed font|
|source/0_0.html|Generated classes|12|12 paired semantic renames|0|
|source/0_0.html|Node IDs|11|11 removed|0|

One photo and two Montserrat fonts localized. Lora undefinedundefined export returned HTTP415 on script and manual retry; archival relative reference retained, production does not use it. Preview loads Google Fonts, email falls back to Georgia/Arial. Main offer converted to heading; decorative wrappers retained.

## Verification
HTML table nesting passed. 600:355px high, CTA183×40 at208.5/241. 375:221.875px high, CTA114.375×25 at130.3125/150.625. No horizontal overflow; source image decoded successfully; screenshots inspected.

Browser verification only, not Omnisend/inbox tested. Email clients may omit CSS blend/gradient, min(), or font loading. Outlook VML fallback lacks exact custom cropping and multiply shade; test before sending. No top navigation added because this selection is a standalone sale banner and current request did not ask for it.
