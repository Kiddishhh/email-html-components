import { readFileSync } from 'node:fs';

// Reuse semantic slot roles; source snapshot font defaults remain unchanged.
export const typographyRoles = JSON.parse(readFileSync(new URL('../references/typography-roles.v1.json', import.meta.url), 'utf8'));
