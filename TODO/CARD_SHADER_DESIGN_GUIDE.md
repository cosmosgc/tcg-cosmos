# Special Rare Card Shader Design Guide

## Purpose

Special rare cards should feel collectible at a glance without making normal cards hard to read or harming performance. This guide describes a layered **foil-card effect** for the project’s React, Tailwind, and Vite web interface.

The recommended release path begins with CSS effects (fast to ship, no new dependency) and adds WebGL only for a premium inspect/reveal view if testing shows it is worthwhile.

> Keep the card illustration, game text, and all brand elements original. A card’s shader can evoke materials such as foil, holographic film, prismatic glass, aurora, or etched metal without copying a specific existing card treatment.

---

## Design principles

1. **Rarity is recognized before animation begins.** Use a unique frame, rarity badge, and name treatment; shaders enhance these signals.
2. **The card remains readable.** Never cover rules text, cost, stats, or accessibility-critical icons with moving high-contrast effects.
3. **Motion responds to intent.** Use pointer movement while inspecting a card, and short controlled animation during pack opening.
4. **Effects scale by rarity.** Common cards can remain static; premium effects should be scarce and memorable.
5. **Reduced motion is first-class.** `prefers-reduced-motion` must present a beautiful static finish.

## Rarity visual language

| Tier | Visual treatment | Interaction |
| --- | --- | --- |
| Common | Matte frame; no shader | Static |
| Uncommon | Subtle colored edge or texture | Static |
| Rare | Moving diagonal foil highlight over art area | Hover/pointer tilt |
| Epic | Prismatic foil + soft glint around frame | Pointer tilt + reveal pulse |
| Legendary | Prismatic foil + animated border + particles during reveal | Pointer tilt; restrained idle shimmer |
| Signature / serialized | Bespoke material, serial mark, optional creator/event motif | Dedicated inspect experience |

Use one finish at a time. A card with rainbow foil, particles, a glowing frame, animated background, and pulsing text becomes visually noisy instead of premium.

---

## Recommended rendering architecture

### Layer order

Render a card as a stable base with optional decorative overlays:

```text
Card container (rounded, overflow hidden)
├── Card art
├── Art mask / depth shading
├── Foil overlay (blend mode + opacity)
├── Moving glint (masked to art or border)
├── Frame and rarity ornament
├── Readable game UI (name, cost, rules, stats)
└── Interaction focus ring / tooltip
```

### Why CSS first

The current frontend uses React + Tailwind + Vite and has no game-rendering engine dependency. CSS gradients, custom properties, and `transform` cover the main effect efficiently:

- No WebGL setup or shader compiler errors.
- Good support for collection grids and deck-builder views.
- Easy fallback for older devices and reduced motion.
- The same card data can select the appropriate finish.

Use a WebGL fragment shader only when a detailed card-inspection screen needs physically richer effects such as normal mapping, iridescence, or refraction. Do not render hundreds of WebGL canvases in a collection grid.

---

## Build phase 1 — Establish the base card

### Tasks

- [ ] Create one reusable `CardVisual` React component.
- [ ] Give every card a `rarity` and optional `finish` field.
- [ ] Define a fixed card aspect ratio and rounded clipping boundary.
- [ ] Separate visual art from gameplay text in the DOM.
- [ ] Create static frame colors for all rarities before adding movement.
- [ ] Verify contrast for title, cost, rules, and stats.

### Suggested data model

```ts
type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type CardFinish = 'standard' | 'foil' | 'prismatic' | 'aurora' | 'etched';

type CardVisualData = {
  rarity: CardRarity;
  finish: CardFinish;
  artUrl: string;
  frameVariant: string;
  serialNumber?: string;
};
```

Store the finish as card inventory metadata rather than a client-only cosmetic flag, so it is authoritative in packs, collection views, deck lists, and trades if those are added later.

### Acceptance check

At this stage a static screenshot should still make rarity obvious and all card text readable.

---

## Build phase 2 — CSS foil prototype

### The effect

Create a pseudo-element over the **art region only**. Combine:

- A broad, semi-transparent moving highlight.
- A low-opacity repeating rainbow gradient.
- An opacity value driven by pointer position.
- A slight 3D card tilt on hover or touch drag.

Avoid relying on `mix-blend-mode` alone: the result varies with the artwork beneath it. Pair it with a normal semi-transparent gradient so the finish stays recognizable.

### Example component structure

```tsx
<article className="card" data-finish={card.finish}>
  <div className="card__art">
    <img src={card.artUrl} alt="" />
    <div className="card__foil" aria-hidden="true" />
  </div>
  <header>{/* name, cost, rarity */}</header>
  <section>{/* rules text and stats */}</section>
</article>
```

Art should have meaningful alternative text only if it conveys gameplay-relevant information that is not already available elsewhere. Decorative foil layers must always use `aria-hidden="true"`.

### Example CSS concept

```css
.card {
  --pointer-x: 50%;
  --pointer-y: 50%;
  --rotate-x: 0deg;
  --rotate-y: 0deg;
  transform: perspective(900px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y));
  transition: transform 160ms ease-out;
}

.card__art {
  position: relative;
  overflow: hidden;
}

.card__foil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background:
    radial-gradient(circle at var(--pointer-x) var(--pointer-y), rgba(255,255,255,.72), transparent 26%),
    repeating-linear-gradient(115deg, #ff5aa5 0 8%, #f4e96a 8% 16%, #55e6ff 16% 24%, #9878ff 24% 32%);
  background-size: 100% 100%, 240% 240%;
  background-position: center, var(--pointer-x) var(--pointer-y);
  mix-blend-mode: screen;
  transition: opacity 180ms ease-out;
}

.card[data-finish='foil']:hover .card__foil,
.card[data-finish='prismatic']:hover .card__foil {
  opacity: .42;
}

.card[data-finish='prismatic'] .card__foil {
  opacity: .24;
  animation: foil-drift 5s linear infinite;
}

@keyframes foil-drift {
  to { background-position: center, 100% 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .card, .card__foil { animation: none; transition: none; transform: none; }
  .card[data-finish='prismatic'] .card__foil { opacity: .18; }
}
```

### Pointer interaction guide

On `pointermove`, calculate the pointer position relative to the card bounds, then write CSS custom properties:

```text
x = (pointerX - cardLeft) / cardWidth
y = (pointerY - cardTop) / cardHeight
--pointer-x = x × 100%
--pointer-y = y × 100%
--rotate-y = (x - 0.5) × 8deg
--rotate-x = (0.5 - y) × 8deg
```

Use `requestAnimationFrame` to batch updates. Reset values on `pointerleave`, and disable tilt on coarse pointers unless the user is actively dragging the card. Never attach this handler to every off-screen card in a large grid.

### Acceptance check

- [ ] Foil follows the pointer smoothly on a single inspected card.
- [ ] Text remains static and legible.
- [ ] A collection grid can scroll smoothly with 100+ cards.
- [ ] Keyboard focus does not require hover to identify rarity.
- [ ] Reduced-motion users see a static premium finish.

---

## Build phase 3 — Frame and reveal effects

### Frame shader alternatives

The border is often more reliable than placing effects directly over complex art:

- **Metallic:** two-tone gradient plus small moving specular line.
- **Prismatic:** conic gradient masked into a 6–12px frame.
- **Etched:** repeating texture image at very low opacity.
- **Aurora:** blurred, slow color drift behind a solid readable frame.

Use a CSS mask, nested element, or border-image treatment to constrain the effect to the frame. Do not use animated box shadows on large card lists; they are expensive and can cause visual blur.

### Booster reveal sequence

1. Present the card back with no rarity information.
2. Turn/reveal the card.
3. Trigger a short rarity-specific burst (about 400–900ms).
4. Hold the final card in an inspectable state with pointer foil enabled.
5. Allow Skip/Reveal All at every point.

Reserve particles and large flashes for a single revealed rare card. Respect reduced-motion preferences by swapping the burst for a quick static glow and sound/haptic alternative where available.

---

## Build phase 4 — Optional WebGL premium shader

### When to use it

Choose WebGL only after the CSS prototype has passed usability and performance testing, and only for one large on-screen card at a time—for example, a legendary inspection modal or pack-opening reveal.

### Fragment-shader ingredients

| Ingredient | Purpose |
| --- | --- |
| UV coordinates | Locate the effect within the card texture |
| Pointer/view direction | Shift foil color and highlight with tilt |
| Noise texture | Break up perfect gradients into material texture |
| Thin-film color ramp | Produce controlled iridescence |
| Art luminance mask | Reduce foil over bright/high-detail areas |
| Rounded-rectangle mask | Clip the final card shape cleanly |
| Time uniform | Drive only gentle, low-frequency idle movement |

### Shader pseudocode

```glsl
vec2 uv = vUv;
float noise = texture(uNoise, uv * 4.0 + uTime * 0.02).r;
float angle = dot(normalize(uViewDirection.xy), vec2(0.7, 0.7));
float band = sin((uv.x + uv.y * 0.4 + noise * 0.12 + angle) * 18.0);
vec3 rainbow = palette(band * 0.5 + 0.5);
float highlight = smoothstep(0.35, 0.9, band) * uFoilIntensity;
vec3 finalColor = mix(cardArt.rgb, screen(cardArt.rgb, rainbow), highlight * artMask);
```

This is a concept, not a copy-paste production shader: rendering libraries define uniforms, texture handling, color space, and shader syntax differently.

### WebGL guardrails

- Load the effect only after the image and renderer are ready.
- Provide a CSS/static fallback if WebGL is unavailable or context is lost.
- Pause animation when the tab, modal, or card is not visible.
- Cap device pixel ratio for the effect canvas.
- Dispose textures and renderer resources when closing the inspect view.
- Profile on low- and mid-range mobile hardware, not only desktop development machines.

---

## Asset checklist

- [ ] Card art with a consistent aspect ratio and safe area
- [ ] Transparent frame overlays by faction/rarity
- [ ] Small seamless noise texture (64–256px) for premium materials
- [ ] Rarity icons that work without color
- [ ] Optional masks that limit foil to the art or frame
- [ ] Short reveal VFX/SFX assets per rarity
- [ ] Static fallback preview image for sharing and unsupported devices

Keep textures compact and reusable. A single small noise texture can support many foil variants through color, scale, angle, and opacity parameters.

## Performance budget and test plan

### Rules of thumb

- In a grid, render static frames and at most a subtle non-animated foil texture.
- Animate only a hovered, focused, or opened card.
- Prefer `transform` and `opacity`; avoid animating layout properties.
- Limit blur, filters, blend modes, and large shadows, especially on mobile.
- Use `IntersectionObserver` or virtualization for large collections.

### Test matrix

| Scenario | Expected result |
| --- | --- |
| 100-card collection grid | Smooth scroll; no constant animation per card |
| Deck builder | Clear rarity without relying on hover |
| Keyboard-only navigation | Focused card and rarity are obvious |
| Touch device | No accidental tilt or expensive idle animation |
| Reduced motion | Static but premium appearance |
| Low-end device / battery saver | Static fallback is used if needed |
| Pack opening | Only the active reveal uses high-cost effects |

## Implementation milestones

1. **Static rarity frames:** establish contrast, badges, and original art direction.
2. **One CSS foil card:** implement art-only overlay and pointer properties.
3. **Collection performance:** ensure grids use a non-animated version.
4. **Pack reveal:** add controlled rarity burst and skip controls.
5. **Accessibility review:** reduced motion, focus, touch, and contrast.
6. **Optional WebGL spike:** prototype only one legendary inspect card and compare it with CSS.
7. **Production rollout:** add analytics for inspect/reveal use and error fallback rates.

## Definition of done

A special-card finish is ready when:

- [ ] Its rarity is identifiable while static.
- [ ] It does not obscure card rules or controls.
- [ ] It has a reduced-motion and no-WebGL fallback.
- [ ] It works with mouse, keyboard, and touch input.
- [ ] It has been tested in collection grids and pack reveals.
- [ ] It meets the project’s device performance target.
- [ ] All textures, art, and visual motifs are original or properly licensed.

