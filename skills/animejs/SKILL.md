---
name: animejs
description: Procedural guidance for driving CSS, SVG, and DOM animations with Anime.js, and wiring three-phase animations for smooth htmz partial swaps.
version: 1.0.0
platforms: [macos, linux]
metadata:
  hermes:
    tags: [animation, animejs, htmz, frontend, library, dynamic-ui]
    category: development
---

# Skill: animejs

## Trigger Phrases
- "animate this"
- "add animejs animation"
- "use animejs"
- "create an animejs swap"
- "animating with animejs"
- "animejs transition"

## What This Skill Does
Integrates the lightweight Anime.js animation library with high-fidelity frontend setups (including htmz-driven partial page updates and Basecoat elements) to build premium, dynamic user experiences with micro-animations. It covers script inclusion, stagger effects, CSS property transformations, SVG/DOM transitions, and custom animated form/panel swaps.

---

## Procedure

1. **CDN Script Integration**: Include Anime.js in the main index.html file:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>
   ```

2. **Basic Selection & Properties**: Pass CSS selectors, DOM nodes, or node lists to the `targets` property. Specify animatable properties:
   - **Translates & Transforms**: Use shorthand like `translateX`, `translateY`, `scale`, `rotate`, `skew`.
   - **Colors & Blurs**: Smoothly animate colors, opacities, and box-shadows.
   ```javascript
   anime({
     targets: '#target-element',
     translateX: [50, 0], // animate FROM 50 to 0
     opacity: [0, 1],
     duration: 600,
     easing: 'easeOutQuart'
   });
   ```

3. **Staggered Entry & Exit**: Make lists and grids feel alive using `anime.stagger()`:
   ```javascript
   anime({
     targets: '.stagger-item',
     opacity: [0, 1],
     translateY: [30, 0],
     delay: anime.stagger(100), // 100ms offset per item
     easing: 'easeOutCubic',
     duration: 500
   });
   ```

4. **Wired Animations for htmz Swapping**:
   To create premium dynamic transitions when swapping HTML fragments in htmz, implement the **Three-Phase Animation Swap Pattern**:
   
   - **Phase 1: Exit Animation**. Fade out/slide out the existing target node before loading the new content.
   - **Phase 2: Perform the htmz Swap**. Set `iframe.src` with a cache-buster timestamp and hash targeting the slot.
   - **Phase 3: Entry Animation**. Fade in/slide in the newly swapped content after it is injected.
   
   *Implementation Pattern*:
   Instead of default instant DOM replacement, intercept the transition by wrapping it in an animated function:
   ```javascript
   function animatedSwap(fragmentSrc, targetId) {
     const slot = document.getElementById(targetId);
     if (!slot) return;
     
     // 1. Exit Animation
     anime({
       targets: slot,
       opacity: 0,
       scale: 0.95,
       duration: 250,
       easing: 'easeInQuad',
       complete: function() {
         // 2. Perform Swap
         // Drive htmz iframe to fetch the fragment
         const iframe = document.querySelector('iframe[name="htmz"]');
         if (iframe) {
           iframe.src = fragmentSrc + '?t=' + Date.now() + '#' + targetId;
         }
       }
     });
   }
   
   // 3. Entry Animation Hook (called after HTMZ iframe onload finishes injecting new DOM)
   function triggerEntryAnimation(targetId) {
     const slot = document.getElementById(targetId);
     if (!slot) return;
     
     // Set initial invisible styles for starting position
     slot.style.opacity = 0;
     slot.style.transform = 'scale(0.95)';
     
     // Animate to full visible state
     anime({
       targets: slot,
       opacity: [0, 1],
       scale: [0.95, 1],
       duration: 400,
       easing: 'easeOutBack'
     });
   }
   ```

---

## Notes
- **Reduced Motion Support**: Always check or respect user preferences for reduced motion:
  ```javascript
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // skip translation, just simple quick fade
  }
  ```
- **Timeline Control**: Utilize the Anime.js timeline API `anime.timeline()` to chain multiple complex animations sequentially instead of nested callbacks.

→ [[CHANGELOG.md]] for full history
