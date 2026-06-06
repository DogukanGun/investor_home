---
name: Precision Investor
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  data-md:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-sm:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
---

## Brand & Style
The brand personality is authoritative yet approachable, shifting from an intense, high-pressure "trading floor" aesthetic to a sophisticated, data-rich analytical environment. The target audience includes venture capitalists, angel investors, and financial analysts who require high information density without cognitive overload.

The design style is **Corporate Modern with a Technical Edge**. It prioritizes clarity and utility, using a structured layout and systematic typography to manage complex data. By softening the background from pure black to deep navy and replacing harsh borders with tonal layering, the UI achieves a sense of depth and focus. The visual noise is reduced to ensure that "Deal Quality" and financial metrics remain the primary focal points.

## Colors
This design system utilizes a sophisticated dark-mode palette designed for long-duration usage. 
- **Surface Strategy:** The base background is a deep navy (`#0F172A`), providing a softer foundation than pure black. Component surfaces and cards utilize a lighter charcoal/navy (`#1E293B`) to create natural hierarchy through tonal variance.
- **Functional Accents:** The Primary Blue is used for actions and focus states. Success (Green), Warning (Amber), and Error (Red) are reserved strictly for data status and "Deal Quality" indicators to ensure they command attention without being visually distracting.

## Typography
The typographic system uses a tri-font approach to balance personality, readability, and technical precision:
- **Headings:** Bricolage Grotesque provides a distinctive, modern character for page titles and major section headers.
- **UI & Body:** Hanken Grotesk is the workhorse for all interface labels, paragraphs, and navigation, chosen for its exceptional legibility at small sizes.
- **Data & Metrics:** IBM Plex Mono is used for all numerical values, financial tables, and tickers, ensuring that columns of numbers align perfectly for easy comparison.

## Layout & Spacing
The layout follows a **12-column fluid grid** for desktop, transitioning to a single-column stack for mobile devices. 
- **Rhythm:** A 4px baseline grid ensures consistent vertical rhythm. 
- **Margins:** 24px outer margins are maintained on desktop to provide "breathing room" against the dark background.
- **Density:** High-density data tables should use `spacing-sm` (8px) for cell padding, while general content cards should use `spacing-lg` (24px) to avoid a cluttered appearance.

## Elevation & Depth
This design system moves away from heavy shadows and high-contrast borders in favor of **Tonal Layering**.
- **Level 0 (Base):** Background color `#0F172A`.
- **Level 1 (Cards/Panels):** Surface color `#1E293B`. No shadow, or a very subtle 10% opacity black shadow with a 4px blur.
- **Level 2 (Dropdowns/Modals):** Surface color `#2D3748` with a more pronounced ambient shadow (12px blur, 20% opacity) to indicate temporary overlay.
- **Borders:** When necessary for definition, use a 1px solid border of `#334155` (Slate 700) to provide subtle separation without harshness.

## Shapes
A **Soft** shape language is applied throughout the system.
- Standard components (buttons, inputs, cards) use a `0.25rem` (4px) corner radius.
- Larger containers or distinct modules use `rounded-lg` (8px).
- This subtle rounding maintains the professional "terminal" feel while appearing more modern and less aggressive than sharp 90-degree corners.

## Components
- **Cards:** Use the `#1E293B` surface. Instead of a full border, use a 3px left-border accent to denote "Deal Quality" status (Green, Amber, or Red). 
- **Buttons:** Primary buttons use a solid `#3B82F6` fill with white text. Secondary buttons use a ghost style with a `#334155` border.
- **Deal Quality Badges:** Replace all glow effects with solid, high-contrast badges. Use a desaturated background version of the status color with high-intensity text (e.g., Dark Green background with Bright Green text) for maximum readability.
- **Input Fields:** Use a slightly darker inset fill than the card surface to create a "well" effect, ensuring the focus state uses the Primary Blue border.
- **Data Tables:** Use IBM Plex Mono for all cell content. Use zebra-striping with a 2% opacity difference rather than hard lines to separate rows.