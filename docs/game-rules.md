# Cosmic Convergence — Game Rules (MVP)

One-sentence pitch: a fast, original collectible card game about piloting cosmic factions to
vaporize the enemy leader, built around 5–10 minute hot-seat battles that a new player can learn
in one guided match.

## Setting

The universe is a broken spiral called the **Cosmos Convergence** — fragments of dead stars and
living stardust drifting toward a central event horizon. Factions fight over the remaining light.

## Factions

| Faction | Identity | Play style | Color |
| --- | --- | --- | --- |
| Dawnspire Order | Warrior-priests of a dying sun | Swarm / tempo, wide boards, buffs | Gold |
| Voidmire Syndicate | Agents of the deep dark | Control / removal, drain effects | Teal |
| Starforge Ascendancy | Engineers of living constellations | Ramp / big finishers | Cyan |

Neutral cards (space phenomena and mercenaries) are available to every deck.

## Core rules

- **2 players**, each controls a **Leader** with **30 health**.
- **Deck**: exactly **30 cards**, no more than **3 copies** of any card.
- **Starting hand**: **4 cards**. A player who must draw with an empty deck loses **2 health**
  per card they could not draw.
- **Resource — Energy**: each player has 1 energy on their first turn. At the start of each
  turn energy refills to the player's max energy, and max energy increases by 1 (cap 10).
  Unspent energy does not carry over.
- **Turn sequence**: draw 1 card → play cards / attack in any order → end turn.
- **Board limit**: at most **6 units** per player.

## Card types

- **Unit**: costs energy, has Power and Health, sits on the board. A unit cannot attack the turn
  it is played (summoning sickness) unless it has **Swift**. When it attacks, it exhausts for the
  turn.
- **Action**: costs energy, has an immediate effect, then goes to the discard pile.
- **Equipment**: costs energy, attaches to a friendly unit and grants Power/Health. It is
  discarded with the unit when the unit dies.
- **Leader**: a player's identity and health total. Leaders are chosen before the match and are
  never played from the hand.

## Combat

- A ready (unexhausted) unit may attack **once per turn**. It targets an enemy unit **or** the
  enemy Leader.
- **Bulwark** rule: if the enemy has a Bulwark unit, attacks must target a Bulwark unit.
- Damage is simultaneous: attacker deals its Power to the defender; the defender deals its Power
  back to the attacker. A unit with 0 or less health is destroyed and discarded.

## Keywords

- **Swift**: may attack on the turn it is played.
- **Bulwark**: enemy attacks must target this unit while it is in play.
- **Siphon**: when this unit deals damage, heal the owner's Leader for the same amount.

## Rarities and finishes

| Rarity | Frame color | Default finish |
| --- | --- | --- |
| Common | Slate | standard |
| Uncommon | Green | standard |
| Rare | Blue | foil |
| Epic | Purple | prismatic |
| Legendary | Amber | prismatic |

Finish is stored as card inventory metadata so it stays authoritative in packs, collections, and
decks. See `TODO/CARD_SHADER_DESIGN_GUIDE.md` for the visual treatment.

## Starter set — "Celestial Genesis"

- 3 faction Leaders, 45 faction cards (15 per faction), 8 neutral cards.
- Each faction leads with one archetype: Dawnspire = swarm/tempo, Voidmire = control/removal,
  Starforge = ramp/power growth.
- Starter decks are auto-built for hot-seat play: leader + 29 cards favouring the faction's curve.

## Win condition

Reduce the enemy Leader to 0 health. The match ends immediately and the winner is declared.
