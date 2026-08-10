# Trading Card Game Project Roadmap

## Project vision

Build an original digital collectible trading card game inspired by the accessibility and excitement of games such as Pokémon TCG. Players collect cards by opening booster packs, build decks around distinct factions and strategies, play fast tactical matches, and progress through new sets, quests, and ranked competition.

> **Important:** Make the world, names, characters, mechanics, visual identity, and card artwork original. Use other games as market references only—not as content to copy.

## Product pillars

1. **Opening a booster feels exciting.** Clear rarity reveals, satisfying presentation, duplicate protection, and meaningful pulls.
2. **The first match is easy to understand.** A new player can learn the core loop in one guided game.
3. **Every card has a purpose.** Cards should support a strategy, collection goal, or crafting value.
4. **Fair progression builds trust.** Players can earn competitive decks without relying solely on purchases.
5. **Live sets keep the game fresh.** New cards, balance updates, events, and rotation extend the game over time.

---

## Phase 0 — Define the game (1–2 weeks)

### Goal

Agree on a small, testable version of the game before building systems or art.

### Deliverables

- [ ] One-sentence game pitch
- [ ] Original setting, factions, and visual direction
- [ ] Target audience and supported platforms
- [ ] Core match rules (turn structure, win condition, deck size, resource system)
- [ ] Card taxonomy and rarity tiers
- [ ] MVP scope: what is included and explicitly excluded
- [ ] Monetization and progression principles

### Guide: decide the core match loop

Write the answer to these questions in one page:

| Decision | Recommended MVP starting point |
| --- | --- |
| Match length | 5–10 minutes |
| Deck size | 30 cards |
| Starting hand | 4–5 cards |
| Win condition | Defeat the opponent leader or earn a fixed number of points |
| Resource system | One automatic energy/resource gain each turn |
| Turn phases | Draw → gain resource → main actions → attack → end |
| Card types | Unit, Action, Equipment, Leader/Base |
| Factions | 3 at launch, with distinct play styles |

### Exit criteria

- A teammate can explain a full turn without asking for missing rules.
- You can play a paper prototype with placeholder cards.
- The MVP is small enough to ship without an online marketplace, spectator mode, or complex social features.

---

## Phase 1 — Prototype the battle system (2–4 weeks)

### Goal

Prove that playing the game is fun before investing in collection or shop systems.

### Build

- [ ] Local two-player or hot-seat match
- [ ] Deck shuffle, draw, hand, board, discard pile, and deck counter
- [ ] Turn manager and rules validation
- [ ] Target selection and combat resolution
- [ ] Simple card effects: damage, healing, draw, buff, summon
- [ ] Match result screen
- [ ] Developer controls for fast testing

### Card design starter set

Create 45–60 placeholder cards:

- 3 factions × 12–15 cards each
- 6–10 neutral cards
- A mixture of basic units, high-cost finishers, actions, and equipment
- At least one simple archetype per faction—for example: swarm, control, or power growth

### Testing guide

Run at least 20 internal matches. After each match, record:

- Match duration
- Which cards felt confusing or unfair
- Turns where a player had no useful action
- Whether either player understood why they won or lost
- Which faction/archetype was chosen most often

### Exit criteria

- Average match duration matches the Phase 0 target.
- Players can complete a match without developer help.
- At least two viable strategies exist.
- Critical rules are automated and reliably validated.

---

## Phase 2 — Build collection, decks, and boosters (3–5 weeks)

### Goal

Create the rewarding collection loop around the proven battle system.

### Collection features

- [ ] Card catalogue with filters: faction, type, cost, rarity, owned, and search
- [ ] Owned quantity and variant display
- [ ] Deck builder with legality and card-copy limits
- [ ] Starter decks for each faction
- [ ] Crafting/dusting or a duplicate-conversion system
- [ ] Account inventory stored securely on the server

### Booster design

Define a single launch booster before adding multiple pack types.

| Slot | Example rule |
| --- | --- |
| Pack size | 5 cards |
| Common slots | 3 guaranteed commons |
| Uncommon slot | 1 uncommon or better |
| Rare slot | 1 rare or better |
| Upgrade chance | Small chance for epic/legendary or cosmetic variant |
| Duplicate handling | Grant crafting currency after a copy limit |

### Booster-opening guide

1. Server creates the pack contents from approved drop tables.
2. Server writes the granted cards to the player inventory before the reveal animation.
3. Client plays reveal effects based on rarity; it never decides rewards.
4. Client shows “new” and duplicate indicators.
5. Player can view cards in the collection or open another pack.
6. Log pack ID, reward table version, account ID, and timestamp for support/auditing.

### Exit criteria

- A player can earn/open a booster, review its cards, and build a legal deck.
- Pack outcomes are generated and saved server-side.
- Drop rates are documented and testable.
- Inventory cannot be changed by the client alone.

---

## Phase 3 — Onboarding and progression (2–3 weeks)

### Goal

Help a new player reach their first satisfying deck and match quickly.

### New-player journey

1. Choose a starter faction/leader.
2. Play a scripted tutorial match that introduces one concept at a time.
3. Receive a starter deck and first booster.
4. Complete three simple quests: play matches, open a pack, edit a deck.
5. Enter casual matchmaking with a recommended deck.

### Progression systems

- [ ] Account level with non-competitive rewards
- [ ] Daily and weekly quests
- [ ] First-win reward
- [ ] Free reward track / battle pass framework
- [ ] Starter deck upgrades
- [ ] Crafting currency and clear earning sources
- [ ] Matchmaking protection for new players

### Economy guardrails

- Make one competitive starter deck achievable early.
- Publish pack odds wherever required by the markets you serve.
- Avoid mechanics that obscure prices or pressure players into repeated purchases.
- Model currency sources and sinks in a spreadsheet before launch.
- Test progression with a fresh account: measure time to a complete starter deck and first crafted card.

### Exit criteria

- A new player understands deck building and their next reward within 30 minutes.
- Daily gameplay has a clear reward without blocking non-paying players.
- Economy assumptions are documented and reviewed.

---

## Phase 4 — Online play and game services (4–8 weeks)

### Goal

Make matches secure, reliable, and ready for real players.

### Core services

- [ ] Authentication and player profiles
- [ ] Authoritative game server or deterministic, server-validated game logic
- [ ] Casual matchmaking
- [ ] Ranked mode with seasons and ratings
- [ ] Reconnect and match recovery behavior
- [ ] Abuse reporting and player blocking
- [ ] Analytics, error tracking, and operational dashboards
- [ ] Admin tools for cards, sets, drop tables, and account support

### Security checklist

- [ ] Validate every match action on the server.
- [ ] Do not trust client-side currency, card ownership, or random rolls.
- [ ] Rate-limit sensitive endpoints and protect authentication.
- [ ] Keep audit logs for trades, purchases, booster rewards, and inventory adjustments.
- [ ] Review authorization for admin tools.
- [ ] Define account restoration and support procedures.

### Exit criteria

- Two remote players can complete a stable match.
- Invalid actions are rejected by the server.
- A disconnected player receives a clear recovery/forfeit outcome.
- Support staff can investigate a pack or inventory issue from logs.

---

## Phase 5 — Content, UX, and polish (ongoing; start early)

### Goal

Give the game its original identity and make every key screen understandable.

### Content pipeline

- [ ] World guide: names, factions, locations, tone, and terminology
- [ ] Card template system and accessible typography
- [ ] Art brief template for every card illustration
- [ ] VFX/SFX rules by rarity and effect type
- [ ] Localization-friendly card text standards
- [ ] Content review for balance, clarity, art, and technical implementation

### UX priorities

- Show why an action is unavailable.
- Preview damage, costs, and targets before confirmation.
- Make card text readable on the smallest supported screen.
- Keep booster skips and reveal speed under player control.
- Provide clear visual differentiation beyond color alone.

### Exit criteria

- Core screens are usable with a fresh account and no tutorial assistance.
- Card text, effects, and rarity are legible and consistent.
- All launch cards meet content, balance, and technical review standards.

---

## Phase 6 — Closed beta and launch (3–6 weeks)

### Goal

Validate retention, balance, stability, and economy with real players before a wider release.

### Closed-beta checklist

- [ ] Invite a small, diverse test group
- [ ] Add feedback form and in-game bug reporting
- [ ] Monitor crashes, queue time, match completion, and server errors
- [ ] Track tutorial completion, first deck edit, first booster open, and first return session
- [ ] Review top decks, win rates, and unplayed cards weekly
- [ ] Test purchases/refunds if monetization is enabled
- [ ] Publish known issues and patch notes

### Launch readiness

- [ ] Privacy policy, terms, age rating, and regional compliance review
- [ ] Customer-support playbook
- [ ] Rollback plan for card data, economy settings, and deployments
- [ ] Load test matchmaking and reward systems
- [ ] Launch event and first-set communication plan
- [ ] Post-launch on-call ownership

### Suggested launch metrics

| Area | What to monitor |
| --- | --- |
| Onboarding | Tutorial completion and first-match completion |
| Engagement | Daily active players, matches/player, booster opens |
| Retention | Day 1, Day 7, and Day 30 return rate |
| Balance | Deck usage, win rate by deck, card play rate |
| Economy | Currency earned/spent, crafting rate, pack acquisition |
| Reliability | Crashes, disconnects, queue times, server error rate |

---

## Recommended MVP order

1. Paper rules + 45–60 placeholder cards
2. Local playable match
3. Basic card effects and automated rules tests
4. Deck builder and starter decks
5. Server-side accounts, inventory, and one booster type
6. Tutorial and simple quests
7. Remote casual matches
8. Closed beta
9. Ranked mode, new set, cosmetics, events, and advanced social features

## Backlog: save for after MVP

- Player-to-player trading or marketplace
- Guilds/clans and friends lists
- Spectator mode and tournaments
- Multiple game modes
- Complex foil/animated card variants
- Cross-platform launch on every device at once
- Hundreds of cards in the first set

## Weekly project rhythm

- **Monday:** choose one measurable goal for each active phase.
- **Midweek:** playtest the current build and log the top three issues.
- **Friday:** demo the newest playable version, update this roadmap, and decide what moves to the next week.
- **Every two weeks:** review scope; remove or defer anything that does not strengthen the core loop of collect → build → battle → earn.

## First-week action plan

- [ ] Write the game pitch and original setting.
- [ ] Select deck size, resource system, and win condition.
- [ ] Create nine sample cards per faction.
- [ ] Run one paper prototype match.
- [ ] Record rule questions and simplify the weakest part.
- [ ] Create a small technical prototype with draw, play, attack, and end-turn actions.

## Definition of done for a feature

A feature is complete only when it has:

- Clear player-facing behavior and edge cases
- Automated tests for important rules or transactions
- Error and loading states
- Analytics events where useful
- Accessibility and mobile/small-screen review
- A short internal help/support note
- Playtest verification

