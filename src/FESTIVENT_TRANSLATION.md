# Festivent Visual Translation → LastLook

## 1. What Festivent Does Visually

- **Hero dominance**: Massive date/headline, festival date as primary info, ticket CTA immediately visible
- **Scroll rhythm**: Long vertical scroll with alternating full-bleed and contained sections
- **Oversized cards**: Program/artist cards are large, tactile, with big imagery and minimal text
- **Playful icon containers**: Rounded, colorful badge-like containers for categories/icons
- **Bold editorial headings**: Very large type, tight tracking, high contrast
- **Section structure**: Clear hierarchy — hero → program → activities → practical info → final CTA
- **Energetic spacing**: Deep padding, breathing room between sections, no cramped UI
- **Motion**: Subtle parallax, fade-ups, hover lifts
- **CTA energy**: Strong warm accent color (orange/red), repeated ticket CTAs

## 2. Patterns Useful for LastLook

- **Hero with date urgency** → Deadline/submission urgency + command pill
- **Program/artist cards** → Reviewer agent lineup cards
- **"Prépare ta visite" section** → "Prepare your submission" practical cards
- **Activities/experiences** → Application improvement experiences
- **Final ticket CTA** → "Run your LastLook before you submit"
- **Scroll storytelling** → Landing page as a journey
- **Alternating layouts** → Break grid monotony
- **Oversized tactile cards** → Make cards feel premium, not dashboard-y

## 3. How Patterns Will Be Reinterpreted Originally

### Hero
- Festivent: "29 juillet au 2 août" + "J'achète mon billet!"
- LastLook: Command pill `lastlook run --before-submit` + "The final check before you submit." + Start CTA
- Journey animation replacing festival imagery: Brief → Memory → Reviewers → Dashboard → Packet

### Program Cards
- Festivent: Artist names, genres, stage info
- LastLook: 7 reviewer cards (Requirement, Fit, Clarity, Evidence, Length, Voice, Risk)
- Each feels like an expert in a lineup, not a chatbot feature

### Practical Prep
- Festivent: Infos festivaliers, hébergements, FAQ
- LastLook: Save memory, Add links, Build packet, Run final check

### Experiences
- Festivent: Family activities, aerial shows, zones
- LastLook: Requirement extraction, Evidence mapping, Generic cleanup, etc.

### Final CTA
- Festivent: "Rejoins la fête, prends ton billet!"
- LastLook: "Run your LastLook before you submit."

## 4. What Must NOT Be Copied

- Festivent brand name, logo, art assets
- Any French copy or specific festival content
- Artist names, imagery, color palette beyond structural reference
- Exact card dimensions or layout measurements
- Any proprietary code or assets

## 5. LastLook-Specific Component Plan

### New CSS Variables to Add
```css
--surface-2: /* secondary surface */
--surface-3: /* tertiary surface */
--text: /* primary text */
--text-muted: /* secondary text */
--border: /* primary border */
--accent: /* primary action */
--accent-2: /* secondary accent */
--success: /* green */
--warning: /* amber */
--danger: /* red */
--shadow: /* shadow base */
--glow: /* accent glow */
```

### Landing Page Sections (in order)
1. **Hero** — Huge headline, command pill, journey animation, CTAs
2. **Submission Journey** — 5 large journey cards with connecting lines
3. **Things That Kill Applications** — Editorial cards, bold typography
4. **Reviewer Lineup** — 7 oversized reviewer cards in grid
5. **Prepare Your Submission** — 4 practical prep cards
6. **Application Packet Preview** — Beautiful exportable packet visual
7. **Final CTA** — "Run your LastLook before you submit"

### App Workspace Layout
- Desktop: Left 60% Application Builder / Right 40% Review Studio
- Or: Left builder timeline / Center editor / Right live review studio
- Full Review primary flow, Tweak Lab secondary tools
- Steps: Opportunity Setup → Brief Intake → Memory → Requirement Coverage → Reviewers → Next Best Edit → Fix Plan → Improved Application → Application Packet

### Review Dashboard (/reviews/:id)
- Top hero: Readiness score (huge), verdict, next best edit, deadline mode, export buttons
- Cards: Requirement coverage, Evidence bank, Reviewer panel, Fix plan, Improved answer, Application packet, Submission risks, Link checklist

### Motion Plan
- Journey card reveal (staggered fade-up)
- Agent scan flow (already exists, reuse)
- Readiness score reveal (count-up)
- Section fade-up (already exists)
- Staggered cards (already exists)
- Hover lift/glow (enhance existing)
- Progress rail (already exists)
- Route transitions (enhance)
- Packet reveal (new)
