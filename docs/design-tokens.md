# Design Tokens

This document captures the initial design language for the Spark user app. Tokens live in `src/theme/tokens.ts` and should be the single source of truth for UI colors, spacing, typography, and component states.

## Colors

| Token | Value | Usage |
| --- | --- | --- |
| `colors.brand` | `#22C55E` | Primary actions, active markers, success states |
| `colors.brandMuted` | `#D1FADF` | Background washes, badges |
| `colors.warning` | `#F97316` | Low battery, warnings |
| `colors.danger` | `#EF4444` | "End ride" CTA, destructive actions |
| `colors.info` | `#0EA5E9` | Timers, informational badges |
| `colors.background` | `#F5F7FA` | App background |
| `colors.card` | `#FFFFFF` | Cards, sheets |
| `colors.border` | `rgba(148, 163, 184, 0.2)` | Dividers and outlines |
| `colors.text` | `#111827` | Primary copy |
| `colors.textMuted` | `#6B7280` | Secondary copy |

## Typography

| Token | Size/Line | Weight | Typical Use |
| --- | --- | --- | --- |
| `typography.titleXL` | 28 / 34 | 700 | Hero titles, receipts |
| `typography.titleL` | 22 / 28 | 700 | Section headers |
| `typography.titleM` | 18 / 24 | 600 | Card titles |
| `typography.bodyM` | 16 / 24 | 500 | Body copy, buttons |
| `typography.bodyS` | 14 / 20 | 500 | Labels, metadata |
| `typography.caption` | 12 / 18 | 400 | Helper text |
| `typography.numeric` | 24 / 32 | 600 | Timers, price emphasis |

## Spacing and Radii

- `spacing`: `{ xs:4, sm:8, md:12, lg:16, xl:24, xxl:32 }`
- `radii`: `{ control:16, card:24, pill:999 }`

Apply these values instead of hard-coded numbers to keep paddings consistent across cards, filters, and full-width CTA buttons.

## Shadows

`shadows.soft` represents the lifted card style from the mockups (blurred, low-contrast shadow). Use it for floating cards, dialogs, and the AuthGate surface.

## Component Tokens

- `buttons`: presets for `primary`, `secondary`, and `danger` buttons (background, text, border colors).
- `tags.filter`: default vs active state colors for chips such as "Senaste 30 dagarna".
- `badges`: color pairs for info/success/warning/danger pills (timers, status labels).
- `map`: available/unavailable scooter marker styling.

## Usage Guidelines

1. Import `theme` from `src/theme` and spread the relevant token into your StyleSheet:
   ```ts
   import { theme } from '../theme';

   const styles = StyleSheet.create({
     card: {
       backgroundColor: theme.colors.card,
       borderRadius: theme.radii.card,
       padding: theme.spacing.xl,
       ...theme.shadows.soft,
     },
   });
   ```
2. Create semantic wrappers (e.g., `PrimaryButton`, `StatusBadge`) that pull from the `buttons` or `badges` tokens instead of redefining colors locally.
3. When adding new UI scenarios (Apple login, ride summary, history filters), extend the token objects first so the rest of the app can reuse the values.
