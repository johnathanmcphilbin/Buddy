# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Teens aged 13-18 browsing Hack Club's YSWS (You Ship, We Ship) programs, deciding whether to commit time to a project. A second, equally important audience is teens already building: they return to the site as a working reference/dashboard for How It Works, the Bits Shop, and Submit while actively working on their Buddy.

## Product Purpose

Buddy is a Hack Club YSWS program: teens train their own computer-vision object detector (via Roboflow) on objects of their choosing, write the logic that interprets what the detector sees, and wire it to browser text-to-speech so their "Buddy" talks based on what it observes (e.g. "you forgot your keys"). Success is a working webcam demo with a self-trained detector, custom logic producing at least 6 distinct spoken outcomes, and a submitted video/dataset. Hours worked (tracked via Hackatime or Lapse) convert into "Bits," a currency spendable in the Buddy Shop.

## Positioning

Two things a generic "build an AI project" tutorial page could not truthfully claim:
1. **No shortcuts, no stock data/APIs.** The detector must be trained on the builder's own photos; no wrapping a general vision API or LLM around the project. The skill being built is real, hands-on object detection and logic-writing, not prompting.
2. **Time becomes real reward.** Logged build hours convert 1:1 into Bits (1 Bit = $5 of reward value), spendable on tangible upgrades (AI credits, webcam, custom voice, hardware) in the Shop — not just a badge or certificate.

## Operating Context

- Builders use Roboflow (external tool) to upload and label photos and train their detector.
- Builders track hours with Hackatime or Lapse; logged hours convert to Bits.
- The site has three functional surfaces: the landing page (`/`, pitch + how-it-works + FAQ), the Shop (`/shop.html`, spend Bits on upgrades), and Submit (`/submit.html`, submit the finished project).
- A "Level" system (see BuddyLevel.svelte) frames the build as tiers of capability (e.g. "Level 1: Base Buddy — sees, understands, talks"), with a downloadable PDF build guide per level.
- Live webcam demo is core to both the pitch (hero demo image) and the final submission requirement.

## Capabilities and Constraints

- Must detect multiple objects at once, react to combinations/counts of objects, and speak varied responses (6+ distinct outcomes minimum).
- No ML expertise required from builders; starter code is provided for webcam, model loading, and bounding boxes — builders focus on training their own model and writing the decision/response logic.
- AI-generated (LLM) responses are an optional upgrade, not the baseline mechanism.
- Estimated base build time: 4-5 hours; further work earns more Bits and unlocks upgrades.

## Brand Commitments

Hack Club affiliation (Hack Club flag/logo present, links to hackclub.com and its privacy/terms) is a confirmed, binding fact of the product. No other visual/brand elements are locked as commitments — the current hand-drawn/rough.js sketch styling and Hack Club flag color palette are incumbent implementation, not confirmed binding constraints, and may be revisited in future design work.

## Evidence on Hand

- Real program mechanics (Bits conversion rate, hour estimate, submission requirements) are documented in the current FAQ copy and treated as factual, not placeholder, despite an existing `<meta description>` labeling the page "placeholder copy" — flag that meta tag as stale rather than trusting it over the FAQ content.
- Showcase/idea cards (Ready to Leave, Study Buddy, Hand Sign Controller, Card Counter, Snack Patrol, Room Checker) are example project ideas, not real user submissions — do not present them as testimonials or completed projects.
- Art credit: Callum Moody (linked in footer) — existing illustration assets are real, not placeholder.

## Product Principles

1. Real skill over shortcuts: every design and copy decision should reinforce that builders do genuine, hands-on ML/logic work, not thin wrapping.
2. Reward the grind visibly: hours and progress (Bits, Levels) should feel tracked and earned, not abstract.
3. Serve two moments equally: the page must both convert a browsing teen into a builder, and function as a clear reference/dashboard for a teen already building.
4. Low intimidation, real capability: never assume prior ML knowledge; make the path from zero to a working detector feel achievable.
