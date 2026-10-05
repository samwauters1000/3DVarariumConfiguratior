# Vararium Configurator - Development Plan

The product name is **Vararium** (top bar: one bold title "Vararium Configurator" on the left, browser tab: "Vararium Configurator" with the terrarium icon in the darkest green of the palette (`#2f432b`, `--color-dark`), see `public/favicon.svg`).

## Progress

| Phase | Status | Notes |
|---|---|---|
| 1 - Project Foundation | Done | Vite + React, responsive layout (desktop / tablet / mobile), data-driven options panel, design tokens from the moodboard. |
| 2 - Basic 3D Scene | Done | React Three Fiber scene, lighting, floor grid with 360° ring, orbit camera (rotate / zoom, no pan, limited angles), bottom camera toolbar driving the same camera. |
| 3 - Terrarium Selection | Done (placeholders) | Six terrariums with placeholder geometry: three regular (dome, prism, bowl) and three special shapes (heart, tiny bottle, panorama tank). The selected one appears in the scene and in the price. |
| 4 - Ground System | Done | Soil with a drainage layer fills the bottom of each terrarium; the terrarium defines the shape, the ground type defines the colours. |
| 5 - Plant Catalogue | Done (placeholders) | 28 placeholder plants in four stacked, foldable sections (Small, Medium, Large, Special), with prices, maximum quantities, ground compatibility, size classes, growth habits and strong natural per-plant variation. |
| 6 - Plant Availability Rules | Done | Centralised in `rules/plantRules.js`: terrarium required, ground compatibility, maximum quantity. |
| 7 - Basic Plant Placement | Done | Plants are placed on the soil (automatically with +, or by drag and drop), can be selected in the scene or in the list, and deleted. Positions are stored relative to the planting area, so they survive a terrarium change. |
| 8 - Drag and Drop | Done | Pointer-based (mouse and touch): drag a plant's thumbnail into the 3D view. A live preview shows where it lands; a red ring and message explain invalid spots (outside the terrarium, too close to another plant). |
| 9 - Object Controls | Done | Move (a visible **Move** section at the top of the selected-object panel with "Pick a new spot" and an arrow pad, a Move button in the 3D toolbar, or drag the selected object across the soil; a red ring shows invalid spots and it snaps back if released there), rotate, scale (from 60% up to 150% for small, 200% for medium and 250% for large objects; "Larger" disabled when there is no room) and delete. Available in the 3D toolbar and in the panel. Keyboard: Delete removes, Escape deselects. |
| 10 - Pricing | Done | Total is always derived from the configuration (`utils/pricing.js`). |
| 11 - Configuration Summary | Done | Confirm opens a receipt-style summary with a rendered preview of the terrarium, a reference number and the date, plus the care warnings ("Before you build"). |
| 12 - PDF Export | Done | jsPDF (loaded on demand) creates an A4 document with the preview image, all items, quantities, prices and the total, followed by a care sheet page. |

| Expansion 5 - More Ground Types | Done | Soil, Sand, Gravel, Moss and Bark, each with its own colours and 3D surface detail (pebbles, moss tufts, bark chips). |
| Expansion 1 - More Plants | Done (first round) | 22 plants: 17 regular (small creepers and climbers up to tall plants like Croton, Pothos and Philodendron verrucosum) and 5 rare collector plants. |
| Expansion 3 - Decoration | Done (first round) | 20 items in Small / Medium / Large sections: stones, wood, ground cover, accents and climbable supports. Organic, low-poly shapes; climbers follow curved supports and share them. |
| Experience round | Done | 3D thumbnails in the catalogue (desktop), first-visit tips, "Fill for me", keyboard control of the selected object, share links. |
| Content round 2 | Done | 6 plants (Lithops, String of Pearls, Bird's Nest Fern, Maidenhair Fern, Mini Aloe, rare Tillandsia xerographica), 3 animals (Red-eyed Tree Frog, Tiny Chameleon, Hermit Crab), 3 decoration items (Cork Background, Mini Pond, Glow Mushrooms). |
| Polish & consistency | Done | Faceted low-poly terrariums (12-sided glass, wooden and brass bases), low-poly soil clumps and sand dunes, idle movement for animals, a solid 3D background so glass stays clear, and the top row of the 3D view (undo / redo, container badge) aligned with the panel title. |
| Expansion 4 - Animals | Done (first round) | Seven cute vivarium animals (snail, dart frog, crested gecko, rolly pollies, springtails, jumping spider, millipede) with colour variants chosen per animal. |
| Moodboard round 2 | Done | Faceted, matte animals with a colour fade to the feet; the terrarium on a wooden potting bench with terracotta pots; a warm desk lamp and a grey-green room in night mode; frosted-glass controls over the 3D view and frosted dialogs. |
| Login for repeat users (Supabase) | In progress (steps 1–3 done) | Optional sign-in (Google or magic link) so saved designs live in the cloud and open on every device. The configurator keeps working without an account. Built: Supabase client, auth hook, **Sign in** button / avatar and name with menu in the top bar, the sign-in dialog, a **test account** to try it without Supabase, and **account settings** (picture: initials, photo or a 3D plant; name; email). Next: connect a Supabase project (`.env`) and cloud saving of designs. See "Login for repeat users" below. |
| Care & equipment round | Done | Care info for every plant and animal (catalogue info button, selected-item panel, PDF care sheet), care warnings for the whole terrarium, a new "Lights" category (glass / mesh lid; real vivarium lights with fixed real sizes, mounted inside the glass with real light: LED grow bars 20 and 60 cm, LED puck, cork LED, UVB T5 tube, moonlight LED, glowing mushroom lamp, fairy lights; a light only fits when the container physically has room for it), night mode, "Save picture" (PNG) and shorter ground descriptions. |

### Natural plant variation

No two plants look the same, like in real life. Every placed plant gets its own variation, derived from its `instanceId` (so it stays identical after moving, switching terrarium or saving):

- **Size:** 70–135% of the species' average (`baseSize`), from young to mature. Medium plants and decoration are drawn 1.2× and large ones 1.4× bigger by default (`SIZE_CLASS_SCALE` in `utils/variation.js`); their ground footprint grows less (square root), since tall plants spread their leaves over their neighbours.
- **Proportions:** height and width vary independently (80–130% and 85–120%), so some plants are tall and narrow, others low and wide.
- **Lean:** the whole plant tilts slightly in a random direction.
- **Colour:** one colour shift for the whole plant, plus differences per leaf.
- **Leaves:** number of leaves, fronds, stems or runners, their length and width, and irregular spacing (e.g. a fern has 9–14 fronds, a Pilea 22–38 leaves).
- **Species extras:** cacti sometimes have a flower or side shoots, orchids 2–5 flowers, pitcher plants 2–4 pitchers, crotons mix green, yellow, orange and red leaves, creepers grow 3–7 randomly curving runners.

The placement rules use each plant's own spread, so a wide plant needs more room than a narrow plant of the same species. When dragging a plant into the terrarium, its id is created at the start of the drag, so the preview shows exactly the plant that will be placed.

Code: `utils/variation.js` (seeded random and plant shape, no three.js), `scene/plants/variation.js` (colour) and `scene/plants/PlantPlaceholder.jsx` (per-species builders).

The plants, decoration, animals, terrariums and ground all use the low-poly style from `3DStylePlants.jpg` (see "3D plant style" below).

### Special containers

The Terrarium options have a dark green **"Special shapes"** group below the regular containers (`collection: 'special'` in `data/terrariums.js`).

| Container | Price | Shape | Capacity | Notes |
|---|---|---|---|---|
| Brass Heart | €68 | Faceted glass heart in a brass frame, flat base | 5 plants | Plants shown at 70% size; heart-shaped soil layers |
| Tiny Bottle | €19 | Corked mini bottle | 3 plants | Plants shown at 45% size; camera zooms in |
| Panorama Tank | €129 | Extra-large rectangular tank (90 × 45 × 45 cm) | No limit | Rectangular soil; camera zooms out |

Supporting features, all data-driven per terrarium:

- `interior.groundShape`: `round`, `box` or `heart`. Soil layers and surface detail (pebbles, chips, tufts) follow the shape.
- `plantSizes`: which plant sizes fit. The Tiny Bottle takes small plants only; the Open Bowl and the Brass Heart take small and medium. Other containers take every size.
- `maxPlants`: capacity. When full, plants show "Terrarium full". Switching to a container that is smaller or lower asks for confirmation and lists what will be removed: plants that are too big, then the most recently added plants beyond the capacity.
- `plantScale`: plants (and surface detail) are shown smaller in small containers.
- `view`: camera framing, 360° ring size and zoom limits. The camera re-frames automatically when the terrarium changes.

### Adding plants from the catalogue

| Device | How to add a plant |
|---|---|
| Desktop / laptop (mouse) | Click anywhere on the plant card, press the + button, or drag the thumbnail into the 3D view. |
| Mobile / tablet (touch) | Press the + button, or drag the thumbnail into the 3D view. Tapping the card itself does nothing, so scrolling the list never adds plants by accident. |

Detection uses the `(hover: hover) and (pointer: fine)` media query (`hooks/useMediaQuery.js`). A click that ends a drag is ignored, so dragging a plant and releasing it over the panel does not add it.

### Plant catalogue: sizes, habits and ground compatibility

The Plants panel lists plants in sections stacked under each other (scroll down): **Small**, **Medium**, **Large** and **Special** (rare collector plants, dark green heading). Plants of a size that do not suit the chosen ground stay in their own size section, as a compact folded row **Not suitable for …** at the bottom of that section; clicking it shows the greyed-out cards with the reason. Each section heading shows how many of its plants grow in the chosen ground and can be clicked to fold the section open or closed (`components/common/CollapsibleSection.jsx`).

| Plant | Section | Habit | Soil | Sand | Gravel | Moss | Bark |
|---|---|---|---|---|---|---|---|
| Fittonia | Small | Bushy | ✓ | | | ✓ | |
| Cushion Moss | Small | Carpet | ✓ | | | ✓ | |
| Pilea | Small | Bushy | ✓ | | | | |
| Pilea glauca | Small | Creeping | ✓ | | | ✓ | |
| Creeping Fig | Small | Climbing | ✓ | | | ✓ | |
| Marcgravia sintenisii | Small | Climbing | | | | ✓ | ✓ |
| Peacock Fern | Small | Creeping | ✓ | | | ✓ | |
| Air Plant | Small | Rosette | | ✓ | ✓ | | ✓ |
| Echeveria | Small | Rosette | | ✓ | ✓ | | |
| Mini Cactus | Small | Upright | | ✓ | ✓ | | |
| Lithops | Small | Rosette | | ✓ | ✓ | | |
| String of Pearls | Small | Creeping | ✓ | ✓ | ✓ | | |
| Fern | Medium | Upright | ✓ | | | ✓ | |
| Peperomia | Medium | Bushy | ✓ | | | ✓ | ✓ |
| Mini Orchid | Medium | Upright | | | | ✓ | ✓ |
| Bromeliad | Medium | Rosette | | | | ✓ | ✓ |
| Bird's Nest Fern | Medium | Rosette | ✓ | | | ✓ | ✓ |
| Maidenhair Fern | Medium | Bushy | ✓ | | | ✓ | |
| Mini Aloe | Medium | Rosette | | ✓ | ✓ | | |
| Croton | Large | Upright | ✓ | | | | |
| Pothos | Large | Climbing (moss pole) | ✓ | | | ✓ | |
| Philodendron verrucosum | Large | Upright | ✓ | | | ✓ | ✓ |
| Jewel Orchid (€38) | Special · small | Rosette | ✓ | | | ✓ | |
| Variegated Haworthia (€42) | Special · small | Rosette | | ✓ | ✓ | | |
| Pitcher Plant (€34) | Special · medium | Climbing | | | | ✓ | |
| Tillandsia xerographica (€32) | Special · medium | Rosette | | ✓ | ✓ | | ✓ |
| Thai Constellation (€89) | Special · large | Upright | ✓ | | | | ✓ |
| Queen Anthurium (€120) | Special · large | Upright | | | | ✓ | ✓ |

- Tropical, moisture-loving plants need soil or moss.
- Epiphytes (orchids, air plant, bromeliad, peperomia) need airy roots: bark or moss.
- Succulents and cacti rot in wet ground, so they only grow in sand or gravel.
- On the dark special cards the + button is an even darker green (`--color-rare-button`) with a gold outline, so it is clearly clickable.
- Rare plants (`rarity: 'rare'`) are limited to three of each per terrarium. Their size class still decides which containers they fit in.
- Plant sizes decide which containers a plant fits (`plantSizes` on terrariums). A plant that is too big shows "Too big for the …".

Compatibility is defined once, on each plant (`compatibleGround`, `size`, `habit` in `data/plants.js`). Switching to a ground that would remove placed plants asks for confirmation first and lists the plants that will be removed.

### Decoration (Expansion 3)

The Decoration category uses the same object system as plants (click / + / drag, move, rotate, scale, delete, undo, save, price, summary, PDF). Items are in `data/decoration.js`; 3D models in `scene/decoration/DecorationPlaceholder.jsx`.

The panel has foldable **Small**, **Medium** and **Large** sections (like Plants). Each card shows the item type (Stone, Wood, Ground cover, Accent, Climbable). Items too big for the chosen container are folded into a compact "Too big for the …" row at the bottom of their section.

| Size | Item | Type | Price | Max |
|---|---|---|---|---|
| Small | River Stones | Stone | €4 | 4 |
| Small | Lava Rock | Stone | €6 | 3 |
| Small | Mossy Pebble | Stone | €5 | 3 |
| Small | Bark Chunks | Wood | €3 | 4 |
| Small | Twig Bundle | Wood | €3 | 4 |
| Small | Leaf Litter | Ground cover | €3 | 4 |
| Small | Pine Cone | Accent | €2 | 3 |
| Small | Mushroom Set | Accent | €5 | 3 |
| Small | Glow Mushrooms | Accent (softly glowing caps) | €6 | 3 |
| Medium | Driftwood Branch | Climbable | €9 | 2 |
| Medium | Cork Tube | Climbable | €12 | 2 |
| Medium | Cork Flat | Climbable | €10 | 2 |
| Medium | Seiryu Stone | Stone | €14 | 2 |
| Medium | Dragon Stone | Stone | €12 | 2 |
| Medium | Root Stump | Wood | €11 | 2 |
| Medium | Mossy Log | Wood | €10 | 2 |
| Medium | Coconut Hide | Accent | €6 | 2 |
| Medium | Mini Pond | Water (dish with still water and pebbles) | €14 | 1 |
| Large | Moss Pole | Climbable | €8 | 2 |
| Large | Spider Wood | Climbable | €18 | 1 |
| Large | Manzanita Branch | Climbable | €16 | 1 |
| Large | Rock Formation | Stone | €22 | 1 |
| Large | Cork Background | Climbable (curved cork wall) | €24 | 1 |

Decoration fits every ground. Its `size` follows the same container rule as plants (large items do not fit the Open Bowl, Brass Heart or Tiny Bottle).

**Organic shapes** (same low-poly, flat-shaded style as the plants):

- Rocks are lumpy, irregular shapes with a flat underside (`createRockGeometry` in `scene/geometry/organic.js`), not regular crystals.
- Wood is built from curved, tapering tubes (`createTaperedTube`): trunks, twigs, forks and roots that spread over the ground.
- Nothing upright stands perfectly straight: items with `organic: { lean, sway }` lean over and bow in the middle along a natural path (`getSupportPath` in `utils/organicShapes.js`), different for every object.

### Climbing plants

Climbers (`habit: 'climbing'`: Creeping Fig, Marcgravia sintenisii, Pothos, Pitcher Plant) are marked "Climber" in the catalogue.

- **Next to a support:** a climber placed next to a climbable item (`climbable: { height, radius }` on decoration) grows up it. A vine runs from the plant's base to the support and spirals up it, following the support's natural lean and bow (the same path the 3D model uses, including the object's rotation). Leaves are in the plant's own style; Marcgravia presses its leaves flat against the surface; the Pitcher Plant hangs pitchers along the vine.
- **Several climbers on one support** each start at their own evenly spread angle around it and stop at slightly different heights, so their vines interleave instead of piling up.
- **Without a support:** climbers creep over the soil (Pothos climbs its own small moss pole).
- **"Next to" means:** the edges of plant and support are within 0.12 scene units (`CLIMB_REACH` in `rules/climbingRules.js`). If several supports are close, the nearest wins.
- **Automatic placement:** adding a climber with + or a card click puts it next to a free support when there is one.
- **Feedback:** the selected-plant panel says "Climbing the Driftwood Branch", or explains how to make it climb.

### Animals (Expansion 4)

The Animals category is active. Animals are configurable objects (no simulation) using the same object system as plants and decoration (click / + / drag, move, rotate, scale, delete, undo, save, price, summary, PDF). Data in `data/animals.js`; cute low-poly models in `scene/animals/AnimalPlaceholder.jsx` (round bodies, big shiny eyes, flat shading).

| Animal | Price | Max | Size | Grounds | Colours |
|---|---|---|---|---|---|
| Garden Snail | €4 | 3 | Small | Soil, Moss, Bark | Amber, Striped, Chocolate |
| Tiny Dart Frog | €35 | 2 | Medium | Moss, Bark | Blue, Yellow, Green & black, Strawberry |
| Tiny Crested Gecko | €45 | 1 | Medium | Soil, Moss, Bark | Flame, Olive, Red, Dark |
| Rolly Pollies (isopods) | €8 | 3 | Small | Soil, Moss, Bark | Classic grey, Dairy cow, Orange, Rubber ducky |
| Springtails | €5 | 2 | Small | Soil, Moss, Bark | White, Grey |
| Jumping Spider | €25 | 1 | Small | All grounds | Regal, Golden, Red back |
| Mini Millipede | €12 | 2 | Small | Soil, Moss, Bark | Rusty, Black, Ivory |
| Red-eyed Tree Frog | €38 | 2 | Medium | Moss, Bark | Classic, Lime, Blue sided |
| Tiny Chameleon | €55 | 1 | Medium | Soil, Moss, Bark | Leaf green, Bark brown, Turquoise |
| Hermit Crab | €18 | 2 | Small | Sand, Gravel | Orange, Purple, Red |

- **Idle movement** (`scene/animals/AnimalIdle.jsx`, `idle` in the data): the frog breathes, the gecko looks around, the snail sways, isopods and the millipede wiggle, springtails and the spider hop now and then. Every animal starts at its own moment. Off when the user prefers reduced motion. While animals are present the scene renders continuously; otherwise only when something changes.
- **Colour variants:** select a placed animal and pick a colour from the swatches in the selected-animal panel (`components/objects/ColorPicker.jsx`). The choice is stored on the instance (`variant`), can be undone, is saved, and shows on the receipt and PDF (e.g. "Tiny Dart Frog (Yellow)", one line per colour). A new animal starts with its first colour. Unknown colours in saved data fall back to the default.
- **Rules:** animals need a suitable (mostly humid) ground ("Does not live in Sand · Needs Moss or Bark"); medium animals do not fit the Tiny Bottle. Unsuitable animals are folded into a "Not suitable for …" row.
- Tests in `tests/animals.test.js`.

### Micro-animations

Small, purposeful motion (`styles/motion.css`, `utils/microAnimations.js`). A control gets `data-anim="…"`, and every click replays its animation through a `data-anim-playing` attribute (an attribute, because React rewrites `className` when a button changes state, which would cut the animation short).

| Control | Animation |
|---|---|
| Start over | The icon spins back a full turn |
| Reset view (camera toolbar) | The icon spins a full turn |
| Undo / redo | The icon swings left / right |
| Rotate left / right (camera toolbar, 3D object toolbar, panel) | The icon swings in that direction |
| Zoom in / out, larger / smaller, add (+), care info, Move, Saved designs, Save, Copy link | A quick pop |
| Night mode | The new sun or moon turns in |
| Save picture | Camera shutter on the icon, plus a short white flash over the 3D view |
| Fill for me | The sparkle twinkles |
| Move arrows | The arrow nudges in its direction |
| Confirm | Glows once when the design becomes complete |

Also:
- **Press feedback:** buttons give a little when pressed.
- **Check marks:** they scale in when an option is selected.
- **Gentle fade-and-lift** for panels that appear: the selected-object panel, the care info, care tips, folding sections, alerts and new panel content when switching category.

Everything is switched off when the user prefers reduced motion (system setting); the camera flash is skipped too.

### Changes after user testing (round 1)

Feedback from tests with real people, and what was done (`styles/flow.css`):

| # | Feedback | Status |
|---|---|---|
| 1 | Start over should be next to the undo button | **Done:** Start over sits in the undo / redo group at the top left of the 3D view, after a small divider (icon + "Start over"; icon only in narrow 3D views). It is no longer in the top bar. It can still be undone. |
| 2 | Only one title: "Vararium Configurator" in bold on the left, where "Vararium" is now | **Done:** the top bar has one title, "Vararium Configurator", bold on the left (the page `h1`); the centre title is gone. It shrinks a little on phones (18 px, 16 px under 360 px) so it always fits next to the buttons. |
| 3 | The section navigation is too far from the options it controls | **Done (second version):** the section buttons now sit at the top of the options card, on every device. The card reads top to bottom: the section title ("Ground"), the six section buttons, then a short intro block (`SectionIntro` in `OptionsPanel.jsx`): the section's heading ("Choose a ground layer", 16 px), what the section is for as a larger line (15 px, "The ground decides which plants can grow in your terrarium."), and below that, smaller and muted (13 px), what is chosen and its price ("Soil · €8", or "Nothing selected" / "No plants added"). Then the options. The selection used to sit under the section title in the header; testers found that confusing, so the header now only shows the title. Every section has a heading and a description, including Plants, Decoration, Lights and Animals. The buttons sit on a round (pill-shaped) sunken band with the active section as a round dark green button (`--color-dark`, light icon and label; a segmented control, following the shape rule that everything you click is round), so they read as navigation and are clearly different from the option cards. The separate rail column is gone, so the layout is 3D view and options card (`components/layout/SectionNav.jsx`; the card is 400 px wide, 372 px on smaller laptops). Labels shrink with the available space so every name stays readable, down to 320 px phones. The first version (a rail beside the panel) was not clear enough in testing. |
| 4 | Confirm is used as a "next" button | **Not needed anymore** (decided after the new card layout; Confirm stays as it is). |
| 5 | The overall flow needs fixing without cluttering the right side with buttons | **In progress.** The card layout (title, section buttons, heading, description, selection, options) is the first step. |

### Expert UX review (for point 5, the overall flow)

Method: an expert review against Nielsen's 10 heuristics, plus a first-time-user walkthrough of one task ("design a terrarium for a dart frog") on desktop (1440 px) and phone (390 px), with no saved state. Severity: 4 = blocks or misleads people, 3 = major, 2 = minor, 1 = cosmetic. Shareable report page: https://claude.ai/artifact/QLsWMUq6HLqrext4joSSMi (private until shared from its Share menu).

| # | Finding | Heuristic | Severity |
|---|---|---|---|
| R1 | After choosing a container (or a ground), nothing points to the next section; the panel just stays where it is. | Visibility of system status | 4 |
| R2 | It is not shown which sections are required (container, ground, a plant) and which are optional (decoration, lights, animals). "Nothing selected" looks the same for both. | Match with the real world; recognition | 3 |
| R3 | Plants (and other sections) can be opened before a ground is chosen; every card then says "Unavailable · Choose a ground first", but there is no single message or way back to Ground. | Error prevention; help users recover | 3 |
| R4 | The section buttons show no progress: you cannot see which sections are done. | Visibility of system status | 3 |
| R5 | Phone: after tapping a section, the options start about 300 px below the screen; it looks as if nothing happened. After adding a plant, its card and panel are off-screen too. | Visibility of system status | 3 |
| R6 | The first-visit tips are generic and stay until "Got it": they mention plants while you are choosing a container, and on phones they cover most of the 3D view and overlap the object toolbar. | Help and documentation; aesthetic design | 2 |
| R7 | The summary is a dead end besides "Download PDF": no Save design or Copy link, which are the natural next steps after finishing. | User control and freedom | 2 |
| R8 | "Fill for me" is disabled before a ground is chosen, and the reason is only in a tooltip (invisible on touch). | Visibility; help users recover | 2 |
| R9 | Care warnings only show inside the Plants, Decoration, Lights and Animals panels; a warning made in one section is easy to miss from another. | Visibility of system status | 2 |

**Fixed (flow rules in `rules/flowRules.js`, tested in `tests/flow.test.js`):**

- **R1 Next step:** under the selection, a text link points to the next section ("Next: choose a ground ›"). It appears once a required choice is made; optional sections show "Skip: choose lights (optional)". On the last section, when everything required is in, it says "Everything you need is in. Press Confirm below to review your terrarium." It is text, not an extra button, and Confirm is unchanged. If the next section cannot be used yet, it points to the missing step instead.
- **R2 Required or optional:** every section heading has a "Required" or "Optional" label (container, ground and plants are required). An empty optional section says "Nothing added yet · you can skip this".
- **R3 Choose this first:** a section that cannot be used yet shows one message instead of a list of unavailable options: "First choose a container / ground", the reason, and a button that opens that section. Plants, decoration and animals need a container and a ground; lights need a container.
- **R5 Phones:** after choosing another section, the page scrolls so the options card (heading and options) is at the top of the screen; not on the first view, so the app still opens on the 3D view. A newly added item's panel is scrolled into view when it was added from the list (not when selected in the 3D view).
- **R7 Keep or share it:** the summary shows Save design (opens Saved designs) and Copy link right under the preview picture, next to Download PDF.
- **R8 Fill for me:** when it cannot be used, the reason is shown as text in the banner instead of only on hover.

**Feedback on these fixes:** R2, R3, R7 and R8 are good. R1 is a start but not liked yet; it stays for now and will be revisited later (the other ideas, a glowing next section, a "Continue" pill or moving on automatically, were not liked either). R5 will be checked on a real phone and tablet later.

**Decided after that:**
- **R4 dropped:** no progress bar, ticks or similar. A configurator is not a game with collected items; the flow has to be clear without it.
- **R6 fixed** (`components/layout/GuidanceHints.jsx`; the old tips box is removed):
  - **Step hint** at the top of the 3D view while the basics are missing: "Choose a container to begin" (centre, empty bench), then "Next, choose a ground layer…", then "Now add a plant: click one in the list…" (touch: "press + on one in the list"). It disappears once there is a plant, and while "Pick a new spot" is active.
  - **One tip at a time**, small, above the camera toolbar, only when useful: "Drag the 3D view to turn it, scroll to zoom" once there is a terrarium, and "Drag it to move it…" when an item is selected. A tip disappears for good once the person has done it (turned the view; moved, turned or resized the item) or closes it with ×. Done tips are remembered in this browser (`vararium:tips-done`).
- **R9 fixed:** a section with a care warning gets a small orange dot on its section button (each warning knows the section where it is fixed, `section` in `rules/careWarnings.js`). Hovering shows the warning; tapping opens the section, where the care box lists it. The summary shows the warnings and tips at the end of the receipt ("Before you build"), and the PDF care sheet still lists them too.

What already works well: real-time price, undo/redo plus Start over, clear disabled reasons on each card, care warnings with concrete advice, consistent visual language, and the new card order (title, section buttons, heading, description, selection).

### Building order and panel layout

- **Sub-titles:** every heading inside the panel is a real sub-title, one step below the panel title: 16 px (text above the options is kept between 12 and 16 px), bold, in the text colour, with a count where useful (`.section-label` and the foldable section headings). This covers Small / Medium / Large / Special, Choose a container, Special shapes, Choose a ground layer, Lid, Day light, Extra lights, Selected …, In your terrarium and Saved designs.
  - Only small group labels inside lists stay uppercase and muted: the sections of the price overview and receipt (`.section-label--caps`), field labels (Total, Colour, the care tiles) and the folded "Not suitable for …" rows. This keeps the hierarchy clear.

- **Building order** (category rail, `data/categories.js`): Terrarium → Ground → Plants → Decoration → Lights → Animals. The animals come last, because they move into a finished home. The price overview, receipt and PDF list the sections in the same order.
- **Selected object panel:** when a plant, decoration item or animal is added or selected, its panel (rotate, size, delete, colours for animals, care info) opens directly **under its own card in the catalogue**, not at the top of the panel. On desktop the panel list scrolls to it; on phones the page does not jump away from the 3D view. This only happens for a new selection: opening a category while something is still selected does not jump down to it.
- **Scroll position per view** (`useScrollPerView` in `components/configurator/OptionsPanel.jsx`):
  - A category, or the price overview, always opens **at the top the first time** you visit it. Coming back to one you have already seen restores where you left off.
  - Switching also cancels a smooth scroll still running from the previous view (for example towards a just-added plant), so it cannot carry on into the new one.
  - On phones, where the page scrolls instead of the panel, switching category brings the panel title back into view if the page was scrolled past it.
- **Price overview:** there are no Options / Price tabs at the top anymore. A small **Price** button (about 35% smaller than Confirm) sits next to Confirm at the bottom of the panel. It opens the price overview and turns dark while it is open; clicking it again, "Back to …" in the header, or choosing a category returns to the options.

### Experience features

- **3D thumbnails** (`hooks/useThumbnail.js`): every catalogue card shows a small picture of the item's own 3D model, with a fixed seed so it always shows the same specimen (animals in their first colour, with their colour fade). They work on **every device, including phones and tablets**.
  - **Pre-rendered images:** `npm run thumbnails` (`scripts/generate-thumbnails.mjs`) starts a Vite dev server, opens the app in headless Chrome and renders every plant, decoration item and animal with the app's own renderer. It saves small WebP files (`public/thumbnails/<category>/<id>.webp`, about 2–5 KB each, 61 files ≈ 150 KB) and a list of them with a cache-busting version (`src/data/thumbnails.generated.js`). Phones and tablets just load these images, with no extra 3D work or GPU memory.
  - **Live fallback:** an item without an image yet (for example a newly added plant before the script is run again) is rendered live on desktop by one small hidden canvas (`scene/thumbnails/thumbnailRenderer.jsx`); phones and tablets show the icon for that item.
  - **Run `npm run thumbnails` again after changing or adding models.**
- **Guidance over the 3D view** (`components/layout/GuidanceHints.jsx`): a step hint for the basics (container, ground, first plant) and one tip at a time when it is useful; see review finding R6 below. It replaced the first-visit tips box.
- **Fill for me** (`rules/autoFill.js`, "Not sure where to start?" banner at the top of the Plants panel): replaces what is inside the terrarium with a complete, matching setup, in one undo step.
  - It first clears all plants, decoration, animals, the lid and the lights (`clearContents`); the container and ground stay. So pressing it again gives a fresh setup instead of stacking items on top of each other or going over the limits.
  - When the terrarium already has something in it, the banner says so ("Replaces what is in your terrarium now"), and undo brings the previous design back.
  - Everything suits the chosen ground and container, and anything that does not fit is skipped.
  - **Decoration** (placed first, so it gets the best spots): a climbable support, a stone and a small accent or ground cover.
  - **Plants:** one large, two medium and four small (rare plants are left to the user). Climbers grow up the support.
  - **Lights:** the best day light that physically fits (the longest LED grow bar that fits when light-hungry plants were chosen or in the Panorama Tank, otherwise the LED Puck Light; the Cork LED in the Tiny Bottle) plus Fairy Lights. The mushroom lamp is left to the user.
  - **Animal** (checkbox "Include an animal", on by default): one animal that fits, is not rated Expert, and likes the same humidity as the plants. It comes with a hiding place if it needs one. Open containers get a lid when the animal climbs or the plants love humidity (glass for humid plants, mesh otherwise).
  - The result has no care warnings (checked in `tests/features.test.js`).
- **Moving made visible** (`components/controls/MoveControls.jsx`): many people did not know that objects can be moved, so the selected-object panel (plants, decoration, animals) starts with a **Move** section, and the floating 3D toolbar has a **Move** button.
  - **Pick a new spot:** after pressing it, the object follows the pointer over the soil with a green (fits) or red (blocked) ring, and a click or tap places it there (`SpotPicker` in `scene/PlacementSystem.jsx`; the state is `pickingSpot` in `useSceneApi`). Other objects let these clicks through. A frosted notice at the top of the 3D view explains what to do, says why a red spot is refused ("too close to the glass or another object"), and has a Cancel button. Esc, Cancel or selecting something else also stops it.
  - **Arrow pad:** nudges the object one step, relative to the view (up = away from the viewer, using the camera's angle). A refused step explains why.
  - A short line under it reminds people that dragging in the 3D view (and the arrow keys on desktop) works too.
- **Keyboard** (selected object): arrow keys move it (Alt + arrows for small steps), Shift + Left / Right rotates it, + and − resize it, Delete removes it, Escape deselects. Refused moves (collision, edge) do nothing.
- **Share links** (`utils/shareLink.js`): "Copy link" in the Saved designs dialog creates a URL (`#design=…`) that contains the whole design, including colours. Opening it (also in an already open tab) loads that design; the data is validated like a saved design, and the hash is then removed so a refresh shows the user's own work. If the clipboard is not available, the link is shown in a text field to copy by hand.

### Lights (equipment)

A sixth category, **Lights** (`data/equipment.js`, rules in `rules/equipmentRules.js`, panel in `components/equipment/EquipmentOptions.jsx`, 3D in `scene/equipment/Equipment.jsx`). The panel starts with the real room inside the chosen container ("Room inside the Glass Dome: bars up to 22 cm, round lights up to Ø 9 cm"), then three sections: **Day light**, **Extra lights** and **Lid** (open containers only). Clicking a selected card again removes it. All lights are real vivarium products; there is deliberately no decorative pendant lamp, because that is not used in real vivariums.

Stored as `lid` (id or null) and `lights` (list of ids) in the configuration, part of undo / redo, autosave, saved designs, share links (`l`, `li`) and the price ("Lights" section on the receipt and PDF). Older saves with a single `light` are still read.

**Fixed, real sizes.** Every light has one fixed size in cm (`sizeCm`) and a way of mounting (`mount`). It is drawn at that true size in every container: each terrarium knows how many cm one scene unit is (`cmPerUnit`), so a 20 cm bar looks 20 cm long next to a 25 cm dome and small next to the 90 cm tank. Bars are slim 1.2 × 2.4 cm profiles, fairy-light bulbs are 2.5 mm.

**Real room per container** (`lightSpace` on terrariums, in cm, measured from the 3D glass at the mounting height):

| Container | Light bar | Round light | Soil for a lamp | Cork | Mounted |
|---|---|---|---|---|---|
| Glass Dome (25 cm) | 22 cm | Ø 9 cm | 22 cm | – | Bars on cables to the top, round lights under the top |
| Geometric Prism (22 cm) | 17 cm | Ø 9 cm | 19 cm | – | Same, lower in the faceted roof |
| Open Bowl (30 cm) | 26 cm | Ø 20 cm | 25 cm | – | Everything hangs from a brass rod across the rim |
| Brass Heart (32 cm) | none (no flat top) | Ø 12 cm | 16 cm | – | Round lights just under the dip between the lobes, inside the glass |
| Tiny Bottle (8 cm) | none | Ø 2.5 cm (the neck) | 7 cm | yes | Under the cork |
| Panorama Tank (90 cm) | 84 cm | Ø 30 cm | 80 cm | – | Bars flush under the flat ceiling |

**The lights:**

| Item | Section | Price | Real size | Mount | Fits | Effect |
|---|---|---|---|---|---|---|
| LED Grow Bar 20 cm | Day light | €18 | 20 cm long | Bar | Glass Dome, Open Bowl, Panorama Tank | Full-spectrum 6500 K LED bar; counts as a grow light |
| LED Grow Bar 60 cm | Day light | €39 | 60 cm long | Bar | Panorama Tank | The same, for large tanks |
| LED Puck Light | Day light | €14 | Ø 7 cm | Round | Every container except the Tiny Bottle | Flat neutral-white LED under the top |
| Cork LED Light | Day light | €9 | Ø 2.5 cm | Cork | Tiny Bottle | A cork with one tiny LED bulb: the classic bottle-garden light |
| UVB T5 Tube 38 cm | Extra light | €26 | 38 cm long | Bar | Panorama Tank | UVB tube in a reflector, 6 cm beside the day light; reptiles such as the chameleon need it |
| Moonlight LED | Extra light | €8 | Ø 2 cm | Round | Every container | Tiny blue night light; off by day, on in night mode (like a real one on a timer) |
| Glowing Mushroom Lamp | Extra light | €14 | 6 cm wide | Soil (needs 12 cm) | Every container except the Tiny Bottle | Four mushrooms with softly glowing caps on the soil |
| Fairy Lights 1 m | Extra light | €9 | 1 m string | Flexible | Every container | Micro LEDs every 4 cm on a thin wire, draped around the edge of the soil |
| Glass Lid | Lid | €12 | – | – | Open containers only | Clear glass cover with a brass knob; keeps humidity in and animals from escaping |
| Mesh Lid | Lid | €10 | – | – | Open containers only | See-through metal mesh with a frame; keeps animals in, ventilated (humidity still escapes) |

- **Fit rule** (`getLightFit`): a bar fits when it is not longer than the container's bar room, a round light when it is not wider than its round room, the cork light only with a cork, a soil lamp when there is enough soil, and fairy lights always. A light that does not fit is shown disabled with the real reason, for example "Too long: the Geometric Prism has room for 17 cm", "Too wide: the Tiny Bottle has room for Ø 2.5 cm" or "The Brass Heart has no flat top for a light bar".
- **One day light, any extra lights:** choosing a second day light replaces the first; extra lights combine with everything. Extra lights need a ground layer first.
- **The mushroom lamp has a fixed spot** on the soil (back left). It counts as an obstacle: plants, decoration and animals cannot be placed on it, and anything already standing there moves aside when it is switched on.
- **Switching container:** lights that do not fit the new container are listed in the confirmation ("These lights do not fit inside it: LED Grow Bar 20 cm") and removed. A lid only stays if the new container can take one. Saved or shared data with invalid lids or lights is cleaned up.
- Terrariums say whether they are `closed` (Glass Dome, Geometric, Brass Heart, Tiny Bottle: own lid or narrow opening) or `lidable` (Open Bowl, Panorama Tank). Closed containers show the lid cards disabled with "The … is closed and already has its own top". A terrarium's `top` places the lid on the rim.
- **Realistic lighting:** every light adds real light to the scene with the colour of the real product, and a soft glow (halo) around each source, sized to the real light.
  - By day the lights are on but subtle. In **night mode all lights are clearly on**: stronger light, bright glows, a faint beam of light under the day light, and soft shadows from the day light on capable (desktop) devices.
  - Extra lights are dimmer in small containers, so their glass does not flood with light.

### Night mode and Save picture

Two buttons at the top right of the 3D view (`components/controls/ViewControls.jsx`):

- **Night mode** (moon / sun): a dark grey-green room with a faint cool window glow, a warm architect's desk lamp on the workbench shining on the terrarium, and dark frosted-glass controls (`LIGHTING` in `scene/TerrariumScene.jsx`, `scene/DeskLamp.jsx`; see "Night mode with the desk lamp" under the moodboard). All lights are clearly on (glows, light beam, shadows from the day light); the moonlight LED only switches on at night. Glowing decoration (Glow Mushrooms) stands out too. The state lives in `useSceneApi` and is not saved with the design.
- **Save picture** (camera): downloads a PNG of the current camera view (`vararium-YYYY-MM-DD.png`), without the editing helpers (grid, selection rings). It uses the same snapshot as the summary, with `keepView` so the user's own angle is kept.

### Care info and care warnings

**Care info** (`data/care.js`): every plant has light, water, humidity (Low / Medium / High), difficulty (Easy / Medium / Expert) and one practical tip; every animal has humidity, food, difficulty and a tip. It is shown:

- behind the **info (i) button** on each plant and animal catalogue card, folding open under the card;
- in the **selected plant / animal panel**, as small labelled tiles;
- on the **care sheet page** of the PDF (each plant and animal once).

**Care warnings** (`rules/careWarnings.js`): advice about the whole terrarium. They never block anything (unlike the ground and size rules). Shown as a compact box at the top of the Plants, Decoration, Animals and Lights panels (open when there is a real warning, folded when there are only tips), in the summary ("Before you build") and on the PDF care sheet ("Things to check").

| Warning | When |
|---|---|
| Escape (warning) | A climbing animal (dart frog, gecko, spider, tree frog, chameleon, hermit crab) is in an open container without a lid |
| Hiding place (warning) | An animal that needs a hide has no hiding decoration (`hide: true`: Coconut Hide, Cork Tube, Cork Flat, Cork Background, Mossy Log, Root Stump) |
| Lives alone (warning) | A solitary animal (gecko, jumping spider, chameleon) shares the terrarium with other animals; the clean-up crew (isopods, springtails, snails) is always fine |
| Predators (warning) | Two different predators (e.g. dart frog and tree frog) together |
| UVB (warning) | A chameleon without the UVB T5 Tube (38 cm, so it only fits the Panorama Tank) |
| Humidity (warning) | A humidity-loving animal with dry-loving plants (succulents, cacti, air plants) |
| Dry air (tip) | Humidity-loving plants in an open container or under a mesh lid |
| Light (tip) | Bright-light plants without the LED Grow Light |

Tests in `tests/careAndEquipment.test.js` (care data complete, lid / lamp rules, price, save and share, every warning).

### Ground descriptions

The ground cards are kept short: one line of description ("Rich potting mix for tropical plants.") and a count of how many plants grow in it ("12 plants grow here") instead of a list of plant names. The ground compatibility table above is the full reference.

### Login for repeat users

**Status: steps 1–3 are built (client, auth hook, sign-in dialog and top bar button); steps 4–9 are planned.** This is a base plan; details will change during implementation.

**Built so far:**
- **Top bar:** a **Sign in** button (a round person icon on phones) when signed out. When signed in, a round **avatar** (the Google picture, or the initials on the primary colour) opens a small frosted menu with name, email, a note that cloud saving is coming soon, and **Sign out** (`components/auth/AccountButton.jsx`).
- **Sign-in dialog** (`components/auth/SignInDialog.jsx`): **Continue with Google**, or an email field that sends a magic link (`Check your inbox`), plus the privacy note. It uses the same frosted dialog as the other dialogs.
- **Auth** (`hooks/useAuth.jsx`, `utils/supabaseClient.js`): `user`, `loading`, `signInWithGoogle`, `signInWithEmail`, `signOut`, with the PKCE flow. The `?code=` is removed from the address after sign-in, and share-link hashes are left alone. Errors are readable English messages (including `offline`).
- **Not connected yet:** without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (template: `.env.example`), the dialog says `Sign-in is not connected yet`, the buttons are disabled, and everything else works as before. The Supabase library is then not even downloaded; when it is configured, it loads on demand as a separate chunk.
- `.env` files are in `.gitignore` (except `.env.example`).
- **Test account** (for trying out the signed-in experience without Supabase): the sign-in dialog starts with "Try a test account" → **Use test account**. It signs in instantly as "Test Gardener" (`test@vararium.app`, a Fittonia as picture), marked "Test account" in the menu. It lives only in this browser (`vararium:test-account` in localStorage); signing out keeps its settings for the next time.
- **Signed in, top bar:** the avatar **and the name** in one pill (only the round avatar on phones). Clicking it opens the menu: big avatar, name, email, a **settings** (gear) button and **Sign out**.
- **Account settings** (`components/auth/ProfileSettingsDialog.jsx`), from the gear:
  - A live preview of picture, name and email.
  - **Profile picture:** initials, an **uploaded photo** (cropped to a square and shrunk to 160 px, max 10 MB), the Google picture (real Google accounts), or **any of the 3D plants** from the catalogue (their pre-rendered pictures).
  - **Name** and **email**, checked before saving ("Enter a valid email address").
  - For the test account everything is saved in the browser. For real accounts the name and plant choice are saved in the Supabase account; a changed email sends a confirmation link first; an uploaded photo is kept on this device (until cloud storage for pictures is added).
- One profile shape for both kinds of account (`hooks/useAuth.jsx`): `{ name, email, avatar, isTest }`, with `updateProfile`; the avatar is drawn by `components/auth/Avatar.jsx`.

**To connect it:** create the Supabase project and follow `Setup` below, put the URL and anon key in `.env`, and restart `npm run dev`. Signing in then works; designs are still saved on the device until step 4 is built.

Minimal, optional login with Supabase. The configurator keeps working without an account. Signed-in users get their saved designs in the cloud, on every device.

#### Scope

**In:**
- Sign in with Google or a magic link (no passwords, no reset flows).
- Save, load and delete designs in the cloud.
- Upload existing local designs on first sign-in.

**Out:**
- Profile pages, settings, roles.
- Payments, orders, catalogue in the database.
- Short share links (the `#design=...` links stay as they are).

#### Principles

- **Optional:** nothing in the main flow requires login.
- **Local stays:** `localStorage` keeps working for signed-out users and as an offline fallback.
- **One storage layer:** the rest of the app does not know whether designs come from the browser or from the cloud.
- **Never trust the client:** validate loaded data with the existing `sanitizeConfiguration`, and recalculate the total price from the configuration.
- **English only:** all UI text, errors, comments and docs.

#### Stack

- Supabase (Postgres + Auth), `@supabase/supabase-js`.
- Frontend hosted on GitHub Pages (no own server).

#### Setup

1. Create a Supabase project.
2. Enable the Auth providers **Email (magic link)** and **Google**.
3. In the Auth settings, add the redirect URLs:
   - `http://localhost:5173/`
   - `https://<username>.github.io/<repo>/`
4. Add `.env` (and GitHub Actions secrets for the build):
   ```text
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
   The anon key is public by design. Security comes from RLS, not from hiding this key.
5. Install: `npm install @supabase/supabase-js`.

#### Database

```sql
create table designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  configuration jsonb not null,
  version int not null,
  total_price numeric not null,
  preview_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table designs enable row level security;

create policy "Users read own designs"
  on designs for select using (auth.uid() = user_id);

create policy "Users insert own designs"
  on designs for insert with check (auth.uid() = user_id);

create policy "Users update own designs"
  on designs for update using (auth.uid() = user_id);

create policy "Users delete own designs"
  on designs for delete using (auth.uid() = user_id);
```

Limit: 20 designs per user (the same as local, `MAX_SAVED_DESIGNS`). Enforce it in the app, and optionally with a database trigger.

#### Files

| File | Purpose |
|---|---|
| `src/utils/supabaseClient.js` | Creates the client from the env variables. |
| `src/utils/designStorage.js` | One interface: `listDesigns`, `saveDesign`, `deleteDesign`. Uses Supabase when signed in, `localStorage` when not. |
| `src/hooks/useAuth.jsx` | Auth context: `user`, `loading`, `signInWithGoogle`, `signInWithEmail`, `signOut`. |
| `src/components/auth/SignInDialog.jsx` | Dialog with a Google button and an email field, in the same frosted dialog style as the other dialogs. |
| `src/components/layout/TopBar.jsx` | Add a **Sign in** button (signed out) or a small user menu with **Sign out** (signed in). |
| `src/components/saved/SavedDesignsDialog.jsx` | Switch to `designStorage.js`. Show "Saved in your account" or "Saved on this device". |

Existing files that stay unchanged: reducers, rules, pricing, scene, PDF, `sanitizeConfiguration`.

#### Steps

1. **Client:** add `supabaseClient.js` and the env variables.
2. **Auth hook:** `useAuth` with `onAuthStateChange`, wrapped around the app.
3. **Sign-in dialog and top bar button.**
4. **Storage layer:** `designStorage.js`, with the local and cloud versions behind one interface.
5. **Connect Saved designs** to the storage layer.
6. **First sign-in:** if local designs exist, ask "Upload your N local designs to your account?".
7. **Error handling:** offline, an expired session and failed saves show a readable English message. Nothing crashes, and the local fallback keeps working.
8. **Tests:** the storage layer with a mocked client (signed out, signed in, invalid data, the 20-design limit).
9. **Deploy:** add the secrets to GitHub Actions and the redirect URL for the live site.

#### Watch out for

- **Hash conflict:** share links use `#design=...`, and Supabase can use the URL hash for auth tokens. Use the PKCE flow (`auth: { flowType: 'pkce' }`) so tokens come back as a `?code=` query, and make sure the share-link reader ignores auth parameters.
- **GitHub Pages base path:** the redirect URL must include the repo path (`/<repo>/`), matching `base` in `vite.config.js`.
- **RLS on:** without the policies above, anyone could read everyone's designs. Test with two accounts.
- **Free tier:** Supabase pauses inactive projects. Open the project before showing it in a portfolio.
- **Privacy:** only the email address is stored. Add a short note in the sign-in dialog.

#### Notes from the current code

These connect the plan to what already exists, as a starting point for implementation:

- **Today's local storage** is `src/utils/configurationStorage.js`. It has `listSavedDesigns`, `saveDesign({ name, configuration, thumbnail, summary })`, `deleteDesign` and `MAX_SAVED_DESIGNS = 20`, and stores the autosave separately. The local half of `designStorage.js` can wrap these, so local behaviour stays exactly the same. The autosave stays local only.
- **Preview pictures:** local designs store the thumbnail as a data URL. For the cloud, either keep a small data URL in the row or upload it to Supabase Storage and save its address in `preview_url`. This is still to decide.
- **Share links** are read by `takeSharedConfiguration` in `src/utils/shareLink.js`, which only reacts to a hash that starts with `design=`. An auth `?code=` query from the PKCE flow does not clash with it, but the query should be removed from the URL after sign-in, as the share-link hash already is.
- **`vite.config.js` has no `base` yet.** It is needed for GitHub Pages (`base: '/<repo>/'`). The pre-rendered thumbnails already use `import.meta.env.BASE_URL`, so they keep working.
- **Saved data from the cloud** goes through `sanitizeConfiguration`, exactly like local saves and share links. The stored `total_price` is only for display in the list; the real total is always recalculated from the configuration.

#### Done when

- A signed-out user can still build, save locally, share and export a PDF.
- A signed-in user can save a design on one device and open it on another.
- A user cannot see or change another user's designs (tested).
- Signing out returns to local-only storage without errors.
- The 3D scene, rules and pricing are unchanged.

### Roadmap before Decoration and Animals

Agreed order of the remaining foundation work:

| # | Step | Status |
|---|---|---|
| 1 | Generic placeable objects: one system for plants, decoration and animals (placement, selection, move/rotate/scale, pricing, summary) | Done |
| 2 | Advanced placement: collision on move, shape-aware planting area (round / rectangle), per-item footprint, boundary check against the container | Done |
| 3 | Model loading with fallback: use a `.glb` when it exists, otherwise the simple placeholder; report broken models | Done |
| 4 | Undo / redo (buttons from `Layout.jpg`) | Done |
| 5 | Save / load configuration (browser storage) | Done |
| 6 | Automated tests for rules and pricing | Done |
| 7 | Test touch interaction on a real phone / tablet | Planned |

Decoration (Expansion 3) has started ahead of steps 6 and 7 (see below). After that: Animals (Expansion 4). Final step: replace placeholder geometry with high-quality `.glb` models.

### Generic placeable objects (step 1)

Plants, decoration and animals share one system. `data/objectCategories.js` registers each category (label, items); the configuration keeps one array per category (`plants`, `decoration`, `animals`).

- State actions are generic: `addObject`, `moveObject`, `rotateObject`, `scaleObject`, `removeObject`, `selectObject` (with a category id). Selection is `{ categoryId, instanceId }`.
- Availability for any item comes from `getItemAvailability` in `rules/objectRules.js`: terrarium and ground required, ground compatibility (only for items with `compatibleGround`), maximum quantity, container capacity (plants), and free room.
- Shared UI components in `components/objects/`: `CatalogueList` (cards with click / + / drag), `SelectedObject` (rotate / scale / delete panel) and `PlacedObjectList` ("In your terrarium").
- Pricing, the summary and the PDF list every category automatically.
- Drag and drop (`hooks/useObjectDrag.js`) works for any category.

Activating decoration later means adding items to `data/decoration.js`, a placeholder shape, and a small options component that uses the shared components.

### Advanced placement (step 2)

All rules are in `rules/placementRules.js`:

- **Planting area follows the container:** a circle for round containers (the inscribed circle for the hexagonal prism), and a rectangle for the Panorama Tank and the Brass Heart. Corners are now usable.
- **Footprint per item:** `footprint` (ground radius) × `baseSize` × the object's scale × the container's `plantScale`.
- **Collision:** objects may not stand closer than their combined footprints (foliage may overlap a little: factor 0.6). This applies to dragging from the catalogue, moving, and growing an object with "Larger".
- **Boundary:** most of the footprint must stay on the soil, so plants cannot poke through the glass.
- **Moving:** the object follows the pointer with a green ring, which turns red on invalid spots. Releasing on a red spot snaps it back.
- **Automatic placement** (+ button or card click) picks the most open free spot. When nothing fits, the item shows "No room".
- **Switching container** re-checks every object: ones that no longer fit are moved to a free spot.

### Model loading with fallback (step 3)

`scene/models/ModelWithFallback.jsx` is used for every terrarium and placed object:

- If the file at the item's `model` path exists, the real `.glb` is loaded. Placed objects get the same size variation as the placeholders.
- If the file does not exist, the simple placeholder is shown (normal during development).
- If the file exists but is broken, the placeholder is shown and the 3D view says "Some 3D models could not be loaded. Simplified versions are shown." The error is also logged in the console.

### Undo / redo (step 4)

- Every change to the configuration is recorded (up to 50 steps): adding, moving, rotating, scaling, deleting, switching terrarium or ground, loading a design and "Start over". Moving an object is one step, committed on release. Refused actions are not recorded.
- Undo and redo buttons sit at the top left of the 3D view (as in `Layout.jpg`), and are disabled when there is nothing to undo or redo.
- Keyboard: Ctrl/Cmd + Z to undo, Ctrl/Cmd + Shift + Z or Ctrl + Y to redo. Shortcuts are ignored while typing or while a dialog is open.
- Implemented as a history around the configuration reducer in `hooks/useConfigurator.jsx`. Selection is not part of the history.

### Save / load (step 5)

- **Autosave:** the current design is saved in the browser automatically (`localStorage`) and restored when the page is opened again, so a refresh never loses work.
- **Saved designs:** the "Saved designs" button in the top bar opens a dialog to save the current design under a name (with a small preview picture, terrarium, item count and total price) and to load or delete saved designs. Deleting asks for confirmation. Up to 20 designs are kept.
- **Loading can be undone**, like any other change.
- **Safe loading:** stored data is validated before use (`sanitizeConfiguration` in `utils/configurationStorage.js`). Unknown items, duplicates and invalid values are dropped or repaired. Ground compatibility, maximum quantities, container capacity and placement are re-applied, so an old or damaged save can never break the configurator.
- Storage errors (private mode, storage full) are shown as a readable message and never crash the app.
- The configuration has a `version` number (`state/configuration.js`) so future changes to its shape can be migrated.

### Automated tests (step 6)

Run with `npm test` (or `npm run test:watch` while developing). Tests use Vitest and live in `tests/`. They drive the real state reducer and rules without a browser.

| File | Covers |
|---|---|
| `pricing.test.js` | Totals, grouping per item, decoration section, removal, euro formatting |
| `availability.test.js` | Terrarium / ground required, ground compatibility, container size, maximum quantity, rare limit, capacity, "no room" |
| `placement.test.js` | Planting area per shape, validation (inside, collision), auto placement without overlaps, refused moves, refused growth, re-placing after a container switch |
| `configurationChanges.test.js` | What switching ground or terrarium removes (too big, over capacity, unsuitable ground) |
| `history.test.js` | Undo / redo order, no-op actions not recorded, redo cleared by a new change, history limit, undoing "Start over" |
| `storage.test.js` | Loading saved data safely: invalid data, unknown items, duplicates, over-maximum, wrong ground/container, repaired values |
| `decoration.test.js` | Decoration sizes, container size rule, placement without overlaps, organic support paths, several climbers sharing one support |
| `features.test.js` | Fill for me (balanced sizes, suitable plants only, no rare plants, one undo step; complete setup with decoration, lights and an animal without care warnings, animal optional, lights that fit, replaces the existing contents, stays within the limits when pressed repeatedly, one-step undo back to the previous design), share links (round trip with colours, broken links), round-2 content and its rules |
| `animals.test.js` | Default and changed colour variants, undo, ground and container rules, receipt lines per colour, saved colours |
| `climbingAndVariation.test.js` | Climbers find nearby supports, ignore far ones and stones, auto placement next to a support; variation is stable per plant and within range |
| `mergedModel.test.js` | Merging meshes: the colour fade darkens matte parts towards the bottom, leaves glossy parts (eyes) alone, and does nothing without a gradient |
| `careAndEquipment.test.js` | Care data for every plant and animal, care sheet, lids only on open containers, one day light plus extra lights, every light has one fixed real size, the real-room fit rule per container, lights removed on a container switch, objects kept away from the mushroom lamp, "Lights" price, real light sizes and the fit rule per container, save / share round trip (including old single-light saves), every care warning |

To make the logic testable, the reducers moved from `hooks/useConfigurator.jsx` to `state/configurationReducer.js` (plain JavaScript, no React).

### Real device test checklist (step 7)

To be done by hand on a phone and a tablet (run `npm run dev -- --host` and open the shown network address on the device, same Wi-Fi):

- [ ] Rotate the terrarium with one finger; pinch to zoom; the page itself does not scroll or zoom while doing this.
- [ ] Bottom camera buttons (rotate, zoom, reset) respond on the first tap.
- [ ] Tapping a plant card does **not** add it; the + button does.
- [ ] Drag a plant's thumbnail into the 3D view with a finger: preview and green/red ring follow the finger; dropping places it.
- [ ] Select a placed plant by tapping it; drag it to move it; the floating toolbar buttons are easy to tap.
- [ ] Scroll the options panel and the plant sections; fold / unfold sections.
- [ ] Undo / redo buttons, Saved designs dialog (keyboard does not hide the Save button), Confirm and Download PDF.
- [ ] Layout in portrait and landscape; nothing overflows sideways.
- [ ] Performance: rotating stays smooth with 10+ plants in the Panorama Tank.

Note any problems with device and browser name.

Model conventions for the final assets in `public/models/`: one object per file, origin at the centre of the base (where it touches the soil), 1 scene unit ≈ 14 cm (the same scale as the placeholders), facing +Z, and small files for mobile.

---

## 1. Project Overview

Build an interactive, responsive 3D terrarium configurator as a portfolio project.

The user should be able to:

1. Choose a terrarium.
2. Configure the ground.
3. Browse available plants.
4. Place plants inside the terrarium.
5. Move, rotate, scale, and remove placed plants where supported.
6. See which plants are available or unavailable based on configuration rules.
7. See the price of every selected item.
8. See the full configuration price update dynamically.
9. Confirm the configuration.
10. Review the final configuration as a receipt-style summary.
11. Export the final summary as a PDF.

The project should be designed as an expandable configurator rather than a small one-off prototype.

Future configuration categories such as decoration and animals must already have a place in the architecture, but they should remain empty/inactive during the initial implementation.

---

## 2. Core Technology

Use the following stack:

- Vite
- React
- JavaScript
- Three.js
- React Three Fiber
- React Three Drei
- CSS or a suitable CSS architecture
- A PDF generation library for the final export

Do not use Next.js alongside Vite. Vite is the primary project setup.

The application must be responsive from the beginning and work on:

- Desktop
- Tablet
- Mobile

All project-facing text must be written in English.

This includes:

- UI labels
- Buttons
- Error messages
- Validation messages
- Component names
- Variables
- Functions
- Comments
- Data fields
- PDF content
- Documentation
- `PLAN.md`

No Dutch text should be present inside the project.

---

# 3. Main User Flow

The overall flow should be:

```text
Start
  ↓
Choose Terrarium
  ↓
Configure Ground
  ↓
Browse Plants
  ↓
Check Plant Availability
  ↓
Place Plants
  ↓
Adjust Placement
  ↓
Review Price
  ↓
Confirm
  ↓
Configuration Summary
  ↓
Export PDF
```

The user should not be forced through a rigid wizard if the final UI design does not require it.

The interface should allow the user to understand and modify the configuration freely.

---

# 4. Application Structure

Use a component-based architecture.

Suggested structure:

```text
src/
├── components/
│   ├── layout/
│   ├── configurator/
│   ├── terrarium/
│   ├── plants/
│   ├── ground/
│   ├── decoration/
│   ├── animals/
│   ├── controls/
│   ├── pricing/
│   └── summary/
│
├── data/
│   ├── terrariums.js
│   ├── plants.js
│   ├── ground.js
│   ├── decoration.js
│   └── animals.js
│
├── rules/
│   ├── plantRules.js
│   └── placementRules.js
│
├── hooks/
│   ├── useConfigurator.js
│   └── usePrice.js
│
├── utils/
│   ├── pricing.js
│   ├── validation.js
│   └── pdf.js
│
├── scene/
│   ├── TerrariumScene.jsx
│   ├── CameraControls.jsx
│   └── PlacementSystem.jsx
│
├── App.jsx
├── main.jsx
└── styles/
```

The exact structure may change during implementation, but responsibilities should remain separated.

---

# 5. Configuration Data

Configuration data should be stored separately from UI components.

Do not hard-code plant information directly inside React components.

For example:

```js
{
  id: "fern-01",
  name: "Fern",
  price: 6,
  maxQuantity: 3,
  compatibleGround: ["soil"],
  model: "/models/plants/fern.glb"
}
```

This makes it possible to add plants later without rewriting the configurator.

---

# 6. Terrariums

The initial project should support multiple terrarium options.

Each terrarium should have data such as:

```js
{
  id: "terrarium-01",
  name: "Glass Dome",
  price: 35,
  model: "/models/terrariums/glass-dome.glb"
}
```

The exact terrarium models and visual styles should be based on the moodboard references placed in:

```text
public/moodboard/
```

The system should not assume that only one terrarium will ever exist.

---

# 7. Ground System

The initial version uses:

```text
Soil
```

Only one ground type is required for the first implementation.

However, the system must be structured so additional ground types can be added later.

Example:

```js
{
  id: "soil",
  name: "Soil",
  price: 8,
  type: "ground",
  compatiblePlants: [...]
}
```

The soil should visually occupy the bottom of the terrarium.

Plants should appear to grow out of the soil rather than floating above it.

---

# 8. Plant System

The configurator should support more than five plant entries.

The first complete implementation can start with approximately five usable plants, but the data structure should support many more.

Each plant should have:

- Unique ID
- Name
- Price
- 3D model
- Maximum quantity
- Compatible ground types
- Placement information
- Optional future requirements

Example:

```js
{
  id: "plant-fern",
  name: "Fern",
  price: 6,
  maxQuantity: 3,
  compatibleGround: ["soil"],
  model: "/models/plants/fern.glb"
}
```

Do not select the final plant species until the visual references and moodboard have been considered.

---

# 9. Plant Availability

Plants must have an availability state.

Example:

```text
Available
Unavailable
```

If a plant cannot currently be used, it should remain visible but appear disabled/greyed out.

The UI should clearly communicate why the plant is unavailable where appropriate.

Example:

```text
Fern
Requires: Soil
```

If the required condition is not met:

```text
Fern
Unavailable
Requires: Soil
```

The exact visual presentation should follow the moodboard.

---

# 10. Plant Quantity Rules

Each plant can have a maximum allowed quantity.

Example:

```text
Fern
Maximum: 3
Current: 3
```

Once the maximum is reached:

- The plant remains visible.
- The add action becomes unavailable.
- The UI should communicate that the maximum quantity has been reached.

The rule must be data-driven.

Do not implement individual maximum checks separately for every plant.

---

# 11. 3D Scene

The main 3D scene should contain:

```text
Terrarium
├── Glass container
├── Ground
└── Plants
```

The 3D scene must be interactive.

The user should be able to:

- Rotate around the terrarium
- Zoom in
- Zoom out
- Use mouse interaction
- Use touch interaction on supported devices
- Drag plants into the terrarium
- Select placed plants
- Adjust placed plants

The terrarium should remain the visual focus of the application.

---

# 12. Camera Controls

The configurator must support 360-degree rotation around the terrarium.

Use orbit-style camera controls.

The user should be able to:

- Drag around the terrarium
- Rotate horizontally
- Rotate vertically within sensible limits
- Zoom in
- Zoom out

Do not allow the camera to move so far away that the terrarium becomes unusably small.

Do not allow uncontrolled camera movement that makes the interface confusing.

---

# 13. Bottom 3D Controls

In addition to direct mouse/touch interaction, provide a control component at the bottom of the interface.

The exact visual design should follow the moodboard.

The control component should provide access to:

- Rotate left
- Rotate right
- Zoom in
- Zoom out
- Reset view

The direct 3D interaction and bottom controls should control the same camera state.

Do not build two independent camera systems.

---

# 14. Drag and Drop

Plants should support drag-and-drop placement.

Basic interaction:

```text
Plant Catalogue
      ↓
Drag Plant
      ↓
Terrarium
      ↓
Valid Placement
```

On desktop, use pointer/mouse interaction.

On touch devices, provide an equivalent touch-friendly interaction.

The implementation should not depend exclusively on HTML drag-and-drop because the target is a 3D scene.

Use a pointer-based interaction system suitable for React Three Fiber.

---

# 15. Plant Placement

The long-term placement system should support:

- Position
- Rotation
- Scale
- Delete
- Selection
- Maximum quantity
- Ground compatibility
- Placement validation

However, do not implement every advanced placement feature before the basic system works.

Build the placement system in stages.

### Initial placement

A plant should:

1. Be selected from the catalogue.
2. Enter placement mode.
3. Be positioned inside the terrarium.
4. Snap or settle onto the valid ground area.
5. Become part of the configuration.

### Later placement improvements

Add:

- Free movement
- Rotation controls
- Scale controls
- More accurate ground detection
- Collision handling
- Boundary validation
- Better snapping
- Placement feedback

---

# 16. Realistic Placement Concept

Plants should visually behave like objects planted in a terrarium.

Avoid a system where plants simply float at arbitrary coordinates.

The intended relationship is:

```text
        Plant
          │
          │
          │
──────────┴──────────
        Soil
────────────────────
```

The plant should originate from the ground and extend upward.

This is a visual requirement as well as a future placement-validation requirement.

---

# 17. Placement Controls

Selected plants should eventually have controls.

Possible controls:

```text
Selected Plant

[ Rotate Left ] [ Rotate Right ]

[ Smaller ] [ Larger ]

[ Delete ]
```

The exact control layout should be determined by the moodboard.

For the initial implementation, prioritize:

1. Place
2. Select
3. Delete

Advanced transformation controls can be added afterwards.

---

# 18. Configuration Categories

The architecture should support the following categories:

```text
Terrarium
Ground
Plants
Decoration
Lights
Animals
```

Current state: all six categories are active, in this building order ("Lights", first called "Lid & light", was added in the care & equipment round, see "Lights (equipment)" at the top).

Initial active categories:

```text
Terrarium
Ground
Plants
```

Future categories:

```text
Decoration
Animals
```

Do not remove the future categories from the data architecture just because they are empty.

Instead, prepare the structure for them.

---

# 19. Decoration

Decoration is part of the intended final configurator but should be implemented after the core configuration system.

Possible future items:

- Stones
- Branches
- Wood
- Bark
- Decorative objects

Decoration should use the same general architecture as plants:

```text
id
name
price
model
category
placement rules
maximum quantity
```

The first version can contain an empty decoration dataset.

---

# 20. Animals

Animals are a future configuration category.

The first version should contain the category structure but no active animals.

Possible future implementation:

```text
Animals
├── Animal data
├── Prices
├── Models
├── Quantity rules
├── Compatibility rules
└── Placement rules
```

Do not build animal behaviour or simulation in the initial version.

Animals should eventually be treated as configurable objects rather than as a biological simulation.

---

# 21. Rule System

Rules must be centralized.

Do not scatter compatibility conditions across components.

For example:

```text
rules/
├── plantRules.js
└── placementRules.js
```

The rule system should eventually answer questions such as:

```text
Can this plant be added?
Can this plant be placed here?
Has the maximum quantity been reached?
Is the selected ground compatible?
Is the object inside the terrarium?
```

This makes the configurator expandable.

---

# 22. Pricing System

Every configurable item must have a price.

The price should be stored in the item's data.

Example:

```js
{
  id: "plant-fern",
  name: "Fern",
  price: 6
}
```

The total price should be calculated from the current configuration.

Example:

```text
Terrarium       €35
Soil             €8
Fern             €6
Fern             €6
Stone             €3
-------------------
Total            €58
```

The total should update immediately when an item is:

- Added
- Removed
- Changed

Do not manually maintain a separate total value if it can become inconsistent with the configuration.

Calculate the total from the current configuration state.

---

# 23. Price Display

The UI should show:

### Per item

Each item should display its price.

Example:

```text
Fern
€6
```

### Category/subtitle

The relevant category or section should also communicate the selected item prices where appropriate.

### Full price

The current total should remain visible during configuration.

Example:

```text
Total
€58
```

The exact placement and visual style should follow the moodboard.

---

# 24. Configuration State

Use a centralized configuration state.

The state should conceptually contain:

```js
{
  terrarium: null,
  ground: null,
  plants: [],
  decoration: [],
  animals: []
}
```

Example:

```js
{
  terrarium: "terrarium-01",
  ground: "soil",
  plants: [
    {
      id: "plant-fern",
      instanceId: "fern-001",
      position: {...},
      rotation: {...},
      scale: {...}
    }
  ],
  decoration: [],
  animals: []
}
```

The `instanceId` is important because the same plant can exist multiple times.

---

# 25. Confirm Flow

The user should be able to confirm the configuration.

**Confirm button state** (`components/pricing/PanelFooter.jsx`, rule in `getConfirmationIssues`):

- The button is a little greyed out until the design has a terrarium, a ground and at least one plant.
- Once those are there, it turns dark green (`--color-confirm`, `#3b5236`, with light text; hover `#2f432b`) so it is clearly the next step.
- It stays clickable while greyed out. A click shows what is still missing in one sentence, for example "Choose a terrarium, choose a ground and add at least one plant to continue." The same text appears as its tooltip.

Flow:

```text
Configure
   ↓
Confirm
   ↓
Configuration Summary
```

The summary should resemble a receipt or checkout ticket.

Example:

```text
TERRARIUM CONFIGURATION

Glass Dome              €35
Soil                      €8
Fern                      €6
Fern                      €6
Fittonia                  €5
Stone                     €3

----------------------------
TOTAL                    €63
```

The final visual design should be based on the moodboard.

---

# 26. Final Summary

The final summary should contain:

- Selected terrarium
- Ground
- All plants
- Quantities
- Future decoration items when implemented
- Future animal items when implemented
- Individual prices
- Total price

If useful for the final design, also include a visual preview of the completed terrarium.

---

# 27. PDF Export

The confirmed configuration should be exportable as a PDF.

The PDF should contain:

- Project/configuration title
- Terrarium name
- Selected items
- Item quantities
- Individual prices
- Total price
- Optional preview image of the configured terrarium
- A care sheet page: the care warnings ("Things to check") and the care facts and tip of every chosen plant and animal

Example:

```text
TERRARIUM CONFIGURATION

Terrarium
Glass Dome                 €35

Ground
Soil                        €8

Plants
Fern × 2                   €12
Fittonia × 1                €5

-------------------------------
TOTAL                      €60
```

The PDF content must be in English.

The PDF export should be implemented after the configuration summary is working.

---

# 28. Responsive Design

Responsive behaviour is a required feature, not a later improvement.

The interface must work on:

- Large desktop
- Laptop
- Tablet
- Mobile

The 3D viewport should remain usable at every breakpoint.

The UI may change structure between screen sizes.

For example:

### Desktop

```text
┌─────────────┬───────────────────────┬──────────────┐
│ Categories  │      3D Scene         │ Properties   │
│             │                       │              │
│             │                       │              │
└─────────────┴───────────────────────┴──────────────┘
                Bottom Controls
```

### Mobile

```text
┌──────────────────────┐
│      3D Scene        │
│                      │
│                      │
├──────────────────────┤
│ Bottom Camera        │
│ Controls             │
├──────────────────────┤
│ Configuration        │
│ Options              │
└──────────────────────┘
```

Do not simply shrink the desktop UI.

Implemented mobile details: below 640 px the top bar hides the centre title (the brand on the left already shows "Vararium") so the Saved designs and Start over buttons stay on screen; the container badge in the 3D view shrinks and cuts long text with "…". The page is never wider than the screen, checked at 412, 390, 360 and 320 px.

Design mobile interaction intentionally.

---

# 29. Touch Interaction

Touch support must be considered from the beginning.

The user should be able to:

- Rotate the terrarium
- Zoom
- Select plants
- Drag/place plants
- Use configuration controls
- Remove objects

Buttons must have sufficiently large touch targets.

---

# 30. Moodboard Integration

Visual decisions should be based on the files placed in:

```text
public/moodboard/
```

The moodboard can define:

- Terrarium appearance
- Plant appearance
- UI layout
- Typography
- Colour palette
- Spacing
- Buttons
- Camera controls
- Receipt design
- Overall visual tone

Do not invent a final visual style before reviewing the moodboard.

If a moodboard image is clearly associated with a specific part of the application, use that reference when implementing that part.

## Current moodboard references

| File | Defines |
|---|---|
| `ColorPallet.jpg` | Colour palette |
| `Layout.jpg` | Overall layout and placement of controls |
| `UIComponents.jpg` | Component style (buttons, chips, tabs, inputs, cards, alerts) |
| `3DStylePlants.jpg` | 3D style of the plants (low-poly, flat-shaded, real leaf outlines) |
| `3DStyleAnimalCritters.jpg` | 3D style of the animals: faceted low-poly critters with large, irregular flat facets, matte surfaces and soft shadows |
| `3DStyleFrog.webp` | 3D style of the animals: faceted frog whose colour fades into dark green towards the feet |
| `3DWorkkbench.jpg` | Scene setting: a wooden potting bench with terracotta pots and tools, on a muted grey-green background |
| `DarkModeLamp.jpg` | Night mode: a black architect's desk lamp with a warm glow inside the shade, on a dark grey-green background |
| `UIComponentsFrostedGlassEffect.jpg` | Frosted glass UI: translucent, blurred cards with large rounded corners and light text |

When new moodboard images are added, add them to this table.

### Colour palette (`ColorPallet.jpg`)

A soft, botanical sage palette:

| Token | Hex | Suggested use |
|---|---|---|
| `--color-surface` | `#f3f4ec` | Panels, cards, receipt background |
| `--color-surface-alt` | `#e0e5ce` | Page/scene background, subtle fills |
| `--color-primary` | `#bac4ac` | Primary buttons, selected states, active tabs |
| `--color-primary-strong` | `#a2af9e` | Hover states, borders, the 360° ring, focus accents |

A dark colour is needed for contrast (the light palette colours are too light for body text). There is **no black anywhere**: all text and icons use the darkest green of the palette, `#2f432b` (`--color-text`, also `--color-dark` for tooltips, active buttons and the favicon; about 10:1 contrast on the panels), on every device. Form fields inherit it too (browsers default them to black). Muted text is a grey-green (`#607259`). Warning and error colours (soft yellow and soft red, as in `UIComponents.jpg`) are allowed for alerts only.

### Layout (`Layout.jpg`)

Mapped to the terrarium configurator:

- **Top bar:** project title on the left, configuration name in the centre, live total price / Confirm button on the right.
- **Section buttons:** after user testing, the category navigation is a row of icon + label buttons at the top of the options card, under the section title (see "Changes after user testing"). There is no separate rail column anymore. The active category is filled with the primary colour and shows a tooltip label. Inactive future categories are shown disabled.
- **Centre:** the 3D scene fills the viewport. The terrarium stands on a wooden workbench (see `3DWorkkbench.jpg` below; this replaced the original soft floor with a grid), with a ring around it hinting that it can be rotated.
- **Top-left of the scene:** undo / redo / Start over and a badge with the chosen container. This row lines up with the panel title: both use the `--overlay-row-height` token (36 px) and a 16 px top inset. (No item counter: the options panel already lists what is selected.)
- **Floating toolbar above a selected object:** contextual actions such as move, rotate, scale and delete (Phase 9).
  - It always stays inside the 3D view on every device (`scene/ClampToStage.jsx`): when the object is near an edge, the toolbar slides back in instead of running off the screen, and it stays below the top row of controls.
  - In narrow 3D views (phones, small tablets; a container query on the 3D view, under 520 px) it becomes compact: the object name is hidden (the panel shows it) and the buttons are slightly smaller, so the whole toolbar fits.
- **Right:** a properties panel with tabs, e.g. **Items**, **Properties** and **Price**. Collapsible sections list items with a swatch/thumbnail, name, and price aligned right.
- **Bottom centre:** a dark pill-shaped toolbar holding the camera controls (rotate left, rotate right, zoom in, zoom out, reset view).

On mobile, this layout collapses as described in section 28.

### UI components (`UIComponents.jpg`)

A soft, tactile "clay" style:

- Large border radius on everything (pill-shaped buttons, chips, tabs, and inputs; rounded cards).
- **Shape rules** (tokens in `styles/tokens.css`, always use these instead of raw sizes):
  - **Controls** (`--radius-control`): everything you click is fully round, a circle when it only has an icon, a pill when it has text. This includes the category buttons (also the row on phones), tabs, text buttons like "Done", the rows in "In your terrarium", colour swatches, inputs and the catalogue pictures (you can drag them).
  - **Labels** (`--radius-label`): badges, chips, counters, tooltips and notices are pills.
  - **Surfaces:** rounded rectangles in two sizes only: `--radius-surface` for the big panels (top bar, 3D view, options panel, dialogs; smaller on phones) and `--radius-card` for everything inside them (cards, boxes, alerts, previews, the folded "Not suitable" rows).
  - Small round indicators (colour dots, check marks) are circles.
- Soft, layered shadows for elevation instead of hard borders.
- Primary buttons use the primary colour; hover adds a soft glow ring; disabled is flat grey.
- Chips for filters and states (e.g. `Available`, `Selected`, `Disabled`) — useful for plant availability.
- Segmented pill tabs for switching panels.
- Cards with a title, short text, and an image — used for catalogue items (terrariums, plants).
- Alerts (success / warning / error) for validation messages such as "Maximum quantity reached".
- Clean sans-serif typography with a clear scale (display, heading, body, caption).

### 3D plant style (`3DStylePlants.jpg`)

A clean low-poly look, applied to all plants and climbing vines (built in code, no model files):

- **Flat shading:** every surface shows its facets; matte materials (`FlatMaterial` in `scene/plants/PlantPlaceholder.jsx`).
- **Real leaf outlines** from a few triangles (`scene/plants/leafGeometry.js`): `oval` (ficus, fittonia, orchids, echeveria), `lance` (croton, fern leaflets, pitcher plant), `sword` (air plant, bromeliad, haworthia), `round` (peperomia, pilea, marcgravia), `heart` (philodendron, pothos, anthurium, creeping fig) and `monstera` (with slits).
- **Folded leaves:** each leaf angles up from the midrib like a shallow V and droops slightly towards the tip.
- **Thin stems and petioles**, and feathery fronds (pairs of leaflets that shrink towards the tip) for ferns.
- **Details:** golden veins on the Jewel Orchid, pale veins on the Philodendron verrucosum and Queen Anthurium, cream speckles on the Thai Constellation.
- **Lighting:** soft and warm like the reference: bright warm sky light, a warm key light from the front-left and a cool rim light.
- **Real soft shadows:** every solid object casts and receives shadows from the key light, so plants shade the soil and each other.
- **Ambient occlusion** (N8AO via `@react-three/postprocessing`): soft darkening where leaves, stems and soil meet, for the depth seen in the reference.
- **Neutral tone mapping** keeps colours true; plant colours are drawn richer than the soft UI swatches (`richColor`), and leaves are drawn 30% larger than their nominal size (`LEAF_SCALE`).
- **Clearer glass:** lower opacity and weaker reflections, so the planting stays the focus. The 3D scene has a solid background colour (`#e8ebdf`) so the see-through glass blends correctly with the depth effect.
- **Terrariums and ground:** faceted glass (12-sided dome and bowl, 10-sided bottle), flat-shaded wooden and brass bases, and low-poly surface pieces on every ground: soil clumps, sand dunes, pebbles, moss tufts and bark chips. Soil layers follow the facets of their container.

The style keeps all existing behaviour: natural per-plant variation, climbing, sizes and placement. Leaf geometry is shared per shape, so many plants stay light on performance.

### 3D animal style (`3DStyleAnimalCritters.jpg`, `3DStyleFrog.webp`)

The animals look like faceted paper or 3D-printed sculptures (`scene/animals/AnimalPlaceholder.jsx`):

- **Irregular facets:** every body part is a low-poly ball whose corners are moved slightly (the same way every time, without cracks), so the facets are large and uneven like the references instead of evenly round (`getFacetGeometry`).
- **Matte surfaces** (roughness 0.78). Only the eyes stay round and glossy, which keeps the animals cute.
- **Colour fade:** each animal's colour fades strongly into a dark moss green (`#2a3a28`) over the lower three quarters of its height, as on the frog reference. This is applied when the model is merged (`gradient` in `scene/objects/MergedModel.jsx`; `ANIMAL_GRADIENT` in `ObjectModel.jsx`, also used for the catalogue thumbnails). It works for every colour variant.

### Scene setting: the workbench (`3DWorkkbench.jpg`)

The terrarium stands on a low-poly wooden potting bench instead of the floor grid (`scene/Workbench.jsx`):

- A top made of seven planks in slightly different wood tones, with legs, an apron and a lower shelf.
- At the back: a stack of terracotta pots, a small pot and a trowel.
- The bench is sized to the container (its camera `ringRadius`), and the 360° ring from `Layout.jpg` now lies on the bench in a light sage colour.
- The bench shows in "Save picture", the summary preview and the PDF.
- **Before a terrarium is chosen** (first visit, or after "Start over"), the camera uses its own framing (`EMPTY_VIEW` in `scene/cameraSettings.js`): it looks at the bench top from further away, so the whole workbench is visible, with its legs, lower shelf, pots and trowel, on every screen size. Choosing a container switches to that container's framing.

### Night mode with the desk lamp (`DarkModeLamp.jpg`)

- Night mode is a dark grey-green room (`#2a2f2b`) with only a faint cool glow from a window, instead of the earlier navy blue.
- A black architect's desk lamp stands on the bench behind the container (`scene/DeskLamp.jsx`). It has a round base, double arms with joints and a shade with a warm glowing inside, and it shines a warm spot light onto the terrarium. On desktop that light casts soft shadows.
- The lamp is sized and placed to the container, and only appears in night mode.

### Frosted glass UI (`UIComponentsFrostedGlassEffect.jpg`)

Everything that floats over the 3D view is frosted glass (`styles/glass.css`): undo / redo, the container badge, the night / picture buttons, the object toolbar above a selected object, the first-visit tips, the "Choose a terrarium" hint, and the dark camera toolbar at the bottom.

- **Glass:** a translucent sage tint, a strong blur of the scene behind it and a thin light edge, so the terrarium stays visible through the controls.
- **Night mode:** the glass turns dark with light text.
- **Dialogs:** they sit on a blurred, frosted backdrop, and the dialog card itself is slightly translucent.
- **Fallback:** browsers without blur support get a more solid tint, so text stays readable.

---

# 31. Asset Structure

Prepare the public assets for future 3D models.

Suggested structure:

```text
public/
├── moodboard/
│
├── models/
│   ├── terrariums/
│   ├── plants/
│   ├── ground/
│   ├── decoration/
│   └── animals/
│
└── textures/
    ├── terrariums/
    ├── plants/
    ├── ground/
    └── decoration/
```

Use placeholder geometry where necessary during early development.

Do not block development because final 3D models are not ready.

The architecture should allow placeholder models to be replaced later.

---

# 32. 3D Model Requirements

All configurable objects should eventually be separate assets.

For example:

```text
terrarium.glb
fern.glb
fittonia.glb
stone.glb
branch.glb
```

Do not combine every object into one large model.

Separate assets are required so the configurator can:

- Add objects dynamically
- Remove objects
- Duplicate objects
- Transform objects
- Apply configuration rules
- Calculate individual prices

---

# 33. Development Strategy

Build the project in controlled stages.

Do not attempt to build the complete configurator in one step.

## Phase 1 - Project Foundation

Create:

- Vite project
- React setup
- Three.js / React Three Fiber
- Responsive application structure
- Basic UI layout
- English-only project structure

Goal:

A clean application that runs correctly.

---

## Phase 2 - Basic 3D Scene

Create:

- Camera
- Lighting
- Basic terrarium placeholder
- Ground placeholder
- 3D scene

Implement:

- Orbit rotation
- Zoom
- Reset camera
- Bottom camera controls

Goal:

The user can inspect the terrarium from all sides.

---

## Phase 3 - Terrarium Selection

Create multiple terrarium options.

Implement:

- Terrarium catalogue
- Selection
- Price
- Dynamic model loading

Goal:

The selected terrarium appears in the 3D scene and affects the configuration price.

---

## Phase 4 - Ground System

Add the soil system.

Implement:

- Soil data
- Soil price
- Soil visual
- Ground state
- Basic plant compatibility reference

Goal:

The terrarium has a proper ground layer.

---

## Phase 5 - Plant Catalogue

Add the first plant set.

Start with approximately five usable plants.

Implement:

- Plant data
- Names
- Prices
- Models/placeholders
- Maximum quantity
- Ground compatibility

Goal:

The catalogue displays usable plants.

---

## Phase 6 - Plant Availability Rules

Implement the centralized rule system.

The UI should:

- Show compatible plants normally.
- Show incompatible plants as disabled/greyed out.
- Prevent invalid additions.
- Show a clear reason where useful.
- Respect maximum quantities.

Goal:

The configurator behaves according to plant rules rather than simply allowing everything.

---

## Phase 7 - Basic Plant Placement

Implement:

- Select plant
- Add plant
- Place plant inside the terrarium
- Position plant on the ground
- Select placed plant
- Delete plant

Start simple.

Do not implement advanced physics or collision systems yet.

Goal:

The user can actually build a terrarium.

---

## Phase 8 - Drag and Drop

Replace/extend the basic add interaction with proper 3D drag-and-drop.

Implement:

- Pointer interaction
- Touch-compatible interaction
- Drag preview
- Valid placement feedback
- Placement inside terrarium

Goal:

Placing plants feels like a real configurator interaction.

---

## Phase 9 - Object Controls

Add controls for selected objects.

Implement progressively:

1. Delete
2. Move
3. Rotate
4. Scale

Do not overcomplicate the transformation system until basic placement is stable.

---

## Phase 10 - Pricing

Implement centralized price calculation.

Display:

- Item prices
- Quantities
- Total price

Make sure every configuration change updates the total.

Goal:

Pricing always matches the actual configuration.

---

## Phase 11 - Configuration Summary

Implement:

```text
Configure
   ↓
Confirm
   ↓
Summary
```

Create the receipt-style final view.

Goal:

The user can clearly review the completed terrarium before exporting it.

---

## Phase 12 - PDF Export

Implement PDF generation.

The exported document should contain the final configuration and prices.

Add an optional rendered preview if technically appropriate.

Goal:

The user can download a professional configuration document.

---

# 34. Expansion Phases

After the core system works, expand the configurator.

## Expansion 1 - More Plants

Add:

- More species
- Different compatibility requirements
- Different maximum quantities
- More visual variation

Do not modify the core plant system unnecessarily.

---

## Expansion 2 - Advanced Placement

Add:

- Better ground detection
- Better snapping
- Boundary validation
- Collision detection
- More precise positioning
- Improved rotation
- Improved scaling

---

## Expansion 3 - Decoration

Activate the existing decoration category.

Add:

- Stones
- Branches
- Wood
- Bark
- Other decorative elements

Reuse the existing object/configuration architecture.

---

## Expansion 4 - Animals

Activate the animal category.

Add suitable configurable animals.

Keep animal functionality separate from the core plant system.

Do not turn the project into a biological simulation.

---

## Expansion 5 - More Ground Types

Potential future options:

- Sand
- Gravel
- Moss
- Bark
- Other substrates

Once multiple grounds exist, plant compatibility rules become more important.

The rule system should already support this.

---

## Expansion 6 - Saved Configurations

Potential implementation:

```text
Save Configuration
        ↓
Local Storage / Database
        ↓
Load Configuration
```

The initial architecture should keep the configuration in a serializable state so saving can be added later.

---

# 35. Saving Strategy

Current state: saving in the browser is done (see "Save / load (step 5)"). Optional cloud saving with a login is planned (see "Login for repeat users"; the sign-in itself is built).

Saving is intentionally not part of the first core implementation.

However, configuration data should remain serializable.

A saved configuration should eventually be able to store:

- Terrarium ID
- Ground ID
- Plant instances
- Object positions
- Object rotations
- Object scales
- Decoration
- Animals
- Configuration version

Do not make the initial implementation dependent on a database.

Start with a local/browser-based approach if saving is later added.

---

# 36. Error Handling

The application should handle invalid states gracefully.

Examples:

```text
Plant unavailable
Maximum quantity reached
Invalid placement
Object outside terrarium
Missing model
PDF export failed
```

Errors should be communicated in English.

Do not allow a broken state to silently corrupt the configuration.

---

# 37. Performance

## Implemented optimisations

- **Merged models:** every placed plant, decoration item, animal and climbing vine is built from many small meshes, then merged into one mesh per material type with per-vertex colours (`scene/objects/MergedModel.jsx`). Measured with a full Panorama Tank (17 plants, 7 decoration items, 4 animals): 358 → 13 draw calls per frame, twice the frame rate.
- **Memoised models:** `ObjectModel` only re-renders when its own item, seed or colour changes, not on every configuration change.
- **Cheaper shadows and depth:** 1024 px shadow map, ambient occlusion in `low` quality at full resolution (half resolution caused dark stripes at the edge of the 3D view), pixel ratio capped at 1.5, and the shadow setup skips the hidden originals of merged models.
- **Render on demand:** the scene only renders when something changes (camera movement, edits), not continuously.
- **Quality levels per device** (`scene/graphicsQuality.js`): `high` on desktops and laptops with WebGL 2 (ambient occlusion, 1024 px shadows, pixel ratio up to 1.5); `low` on phones, tablets (touch as main input), devices without WebGL 2 or with 4 GB memory or less (no post-processing, 512 px shadows, pixel ratio up to 1.25). Added after the 3D view stayed blank on a tablet: the post-processing buffers on its large, high-resolution screen can exhaust a mobile GPU.
- **Context-loss recovery:** if the browser drops the WebGL context, the 3D view restarts automatically. After three failures within 30 seconds it shows a message instead, and the options panel keeps working.

The configurator should remain responsive even when multiple 3D objects are present.

Keep in mind:

- 3D model file sizes
- Texture sizes
- Number of objects
- Lighting complexity
- Rendering performance
- Mobile performance

Do not add unnecessary high-detail assets during development.

Use placeholders when testing functionality.

---

# 38. Accessibility

The interface should consider:

- Keyboard interaction where practical
- Clear labels
- Sufficient contrast
- Large interactive controls
- Visible selected states
- Clear disabled states
- Text alternatives for important UI information

The 3D scene itself should not be the only way to understand configuration information.

Prices and selected items must also be represented in the normal UI.

---

# 39. Code Quality Rules

Use clear and consistent naming.

Good:

```js
selectedPlant
calculateTotalPrice()
isPlantAvailable()
removePlant()
```

Avoid unclear names:

```js
x
thing
doStuff()
data2
```

Keep components focused.

Avoid putting the entire configurator inside `App.jsx`.

Keep configuration data separate from presentation.

Keep business rules separate from UI.

Keep pricing logic separate from the 3D scene.

---

# 40. Important Architectural Principle

The configurator should be **data-driven**.

Adding a new plant should ideally require adding a new object to the plant data rather than rewriting the UI.

Adding a future decoration should use the same general object system.

Adding a future animal should use the same general object/configuration approach.

Adding a future ground type should use the same compatibility rule system.

The goal is:

```text
New Item
   ↓
Add Data
   ↓
Existing Configurator Handles It
```

rather than:

```text
New Item
   ↓
Rewrite Multiple Components
```

---

# 41. What Should NOT Be Built Initially

Do not build these before the core configurator works:

- Water simulation
- Complex ecosystem simulation
- Animal behaviour
- Advanced physics
- Multiplayer
- User accounts
- Online marketplace
- Payment system
- Database
- Complex backend
- Procedural plant generation
- Advanced biological simulation

These are outside the initial scope.

Note: now that the core configurator works, an optional login with cloud-saved designs is being added (Supabase; see "Login for repeat users"). It stays deliberately small: no profiles, roles, payments or own backend.

---

# 42. Definition of the First Complete Version

The first complete version is successful when a user can:

1. Open the configurator.
2. Choose a terrarium.
3. Configure soil.
4. Browse plants.
5. See which plants are available.
6. Add plants.
7. Respect plant maximum quantities.
8. Place plants inside the terrarium.
9. Remove plants.
10. Rotate the terrarium 360 degrees.
11. Zoom in and out.
12. Use the bottom camera controls.
13. Use mouse/touch interaction.
14. Use drag-and-drop placement.
15. See individual item prices.
16. See the live total price.
17. Confirm the configuration.
18. See a receipt-style summary.
19. Export the configuration as a PDF.

The system should also already contain the structural foundation for:

```text
Decoration
Animals
More plants
More ground types
Advanced placement
Saving configurations
```

but those features do not need to be active in the first complete version.

---

# 43. Final Development Principle

Build from **functionality to complexity**.

The order should generally be:

```text
Foundation
    ↓
3D Scene
    ↓
Terrarium
    ↓
Ground
    ↓
Plants
    ↓
Rules
    ↓
Placement
    ↓
Drag & Drop
    ↓
Controls
    ↓
Pricing
    ↓
Confirmation
    ↓
PDF
    ↓
Polish
    ↓
Expansion
```

Do not jump ahead to visual polish or complex features while the underlying configuration system is unstable.

The final result should feel like a real interactive product configurator, not simply a 3D scene with decorative controls.
