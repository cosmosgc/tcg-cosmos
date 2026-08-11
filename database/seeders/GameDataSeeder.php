<?php

namespace Database\Seeders;

use App\Models\Card;
use App\Models\CardSet;
use App\Models\Faction;
use Illuminate\Database\Seeder;

class GameDataSeeder extends Seeder
{
    /**
     * Seed the core game data: the launch set, factions, and starter cards.
     */
    public function run(): void
    {
        $set = CardSet::updateOrCreate([
            'code' => 'celestial-genesis',
        ], [
            'name' => 'Celestial Genesis',
        ]);

        $factions = [];
        $factionRows = [
            ['code' => 'dawnspire', 'name' => 'Dawnspire Order', 'color' => '#f0b429', 'description' => 'Warrior-priests of a dying sun.', 'playstyle' => 'Swarm and tempo'],
            ['code' => 'voidmire', 'name' => 'Voidmire Syndicate', 'color' => '#2dd4bf', 'description' => 'Agents of the deep dark.', 'playstyle' => 'Control and removal'],
            ['code' => 'starforge', 'name' => 'Starforge Ascendancy', 'color' => '#38bdf8', 'description' => 'Engineers of living constellations.', 'playstyle' => 'Ramp and big finishers'],
        ];

        foreach ($factionRows as $row) {
            $factions[$row['code']] = Faction::updateOrCreate(
                ['code' => $row['code']],
                $row,
            );
        }

        $factionCards = [
            'dawnspire' => [
                ['daw-sentinel', 'Dawnspire Sentinel', 'unit', 1, 1, 3, 'common', ['bulwark'], 'Guards the front line.', []],
                ['daw-disciple', 'Sunwrought Disciple', 'unit', 2, 2, 2, 'common', [], 'Fed on holy light.', []],
                ['daw-talon', 'Emberwing Talon', 'unit', 2, 2, 1, 'common', ['swift'], 'Strikes before the drums sound.', []],
                ['daw-wardbringer', 'Aegis Wardbringer', 'unit', 3, 2, 4, 'common', ['bulwark'], 'Raised the bulwark of the second sun.', []],
                ['daw-cohort', 'Solar Cohort', 'unit', 3, 3, 3, 'uncommon', [], 'Calling the cohort.', [['kind' => 'summon', 'defId' => 'token-sun-spark', 'count' => 1]]],
                ['daw-lancer', 'Star-Pyre Lancer', 'unit', 4, 4, 3, 'common', [], 'Spearhead of the dawn.', []],
                ['daw-phalanx', 'Phalanx of the Second Sun', 'unit', 5, 3, 6, 'rare', ['bulwark'], 'A wall of light.', []],
                ['daw-paragon', 'Lightblade Paragon', 'unit', 5, 4, 4, 'rare', ['swift'], 'Sings as it strikes.', []],
                ['daw-general', 'Sol-Ascendant General', 'unit', 6, 5, 5, 'epic', [], 'The army rises with her.', [['kind' => 'summon', 'defId' => 'token-sun-spark', 'count' => 2]]],
                ['daw-beacon', 'Blazing Beacon', 'action', 1, null, null, 'common', [], 'Deal 2 damage to a unit.', [['kind' => 'damage', 'amount' => 2, 'target' => 'target_unit', 'scope' => 'enemy_unit']]],
                ['daw-grace', 'Kindling Grace', 'action', 1, null, null, 'common', [], 'A friendly unit gets +2 power this turn.', [['kind' => 'buff', 'power' => 2, 'target' => 'target_unit', 'scope' => 'friendly_unit', 'turns' => 'this_turn']]],
                ['daw-resurgence', 'Radiant Resurgence', 'action', 2, null, null, 'uncommon', [], 'Draw 2 cards.', [['kind' => 'draw', 'count' => 2]]],
                ['daw-halo', 'Halo of Dawn', 'action', 2, null, null, 'uncommon', [], 'Heal your leader 4.', [['kind' => 'heal', 'amount' => 4, 'target' => 'friendly_leader']]],
                ['daw-edge', "Dawn's Edge", 'equipment', 2, 2, 1, 'uncommon', [], 'Attached unit gets +2/+1.', []],
                ['daw-wave', 'Kindling Wave', 'action', 3, null, null, 'rare', [], 'Summon two Sun Sparks. Friendly units get +1 power this turn.', [
                    ['kind' => 'summon', 'defId' => 'token-sun-spark', 'count' => 2],
                    ['kind' => 'buff', 'power' => 1, 'target' => 'all_friendly_units', 'turns' => 'this_turn'],
                ]],
            ],
            'voidmire' => [
                ['vdm-skulker', 'Hollowcrypt Skulker', 'unit', 1, 2, 1, 'common', ['swift'], 'Hunts in the outer dark.', []],
                ['vdm-thrall', 'Shadespire Thrall', 'unit', 2, 2, 2, 'common', [], 'Bound to the deep.', []],
                ['vdm-stalker', 'Obsidian Stalker', 'unit', 3, 3, 3, 'common', [], 'Silent as the void between.', []],
                ['vdm-siphoner', 'Dread Siphoner', 'unit', 3, 2, 4, 'uncommon', ['siphon'], 'Feeds on every wound.', []],
                ['vdm-witch', 'Nightveil Witch', 'unit', 4, 3, 4, 'common', [], 'Deal 1 damage to a unit.', [['kind' => 'damage', 'amount' => 1, 'target' => 'target_unit', 'scope' => 'enemy_unit']]],
                ['vdm-reaper', 'Umbral Reaper', 'unit', 5, 4, 3, 'rare', ['swift'], 'Harvests the twilight.', []],
                ['vdm-devourer', 'Void Devourer', 'unit', 6, 5, 5, 'epic', [], 'Destroy a unit with 2 or less power.', [['kind' => 'destroy_unit', 'target' => 'target_unit', 'scope' => 'enemy_unit', 'maxPower' => 2]]],
                ['vdm-assassin', 'Abyssal Assassin', 'unit', 4, 3, 1, 'rare', ['swift', 'siphon'], 'One cut, then gone.', []],
                ['vdm-pact', 'Dark Pact', 'action', 1, null, null, 'uncommon', [], 'Draw 2 cards. Lose 2 leader health.', [
                    ['kind' => 'draw', 'count' => 2],
                    ['kind' => 'damage', 'amount' => 2, 'target' => 'friendly_leader'],
                ]],
                ['vdm-tendrils', 'Tendrils of Night', 'action', 1, null, null, 'common', [], 'Deal 2 damage to a unit.', [['kind' => 'damage', 'amount' => 2, 'target' => 'target_unit', 'scope' => 'enemy_unit']]],
                ['vdm-curse', 'Curse of the Deep', 'action', 2, null, null, 'uncommon', [], 'A unit gets -2/-2 this turn.', [['kind' => 'buff', 'power' => -2, 'health' => -2, 'target' => 'target_unit', 'scope' => 'enemy_unit', 'turns' => 'this_turn']]],
                ['vdm-leech', 'Shadow Leech', 'action', 1, null, null, 'common', [], 'Deal 1 damage to a unit. Heal your leader 1.', [
                    ['kind' => 'damage', 'amount' => 1, 'target' => 'target_unit', 'scope' => 'enemy_unit'],
                    ['kind' => 'heal', 'amount' => 1, 'target' => 'friendly_leader'],
                ]],
                ['vdm-portal', 'Void Portal', 'action', 3, null, null, 'rare', [], 'Destroy a unit with 3 or less power.', [['kind' => 'destroy_unit', 'target' => 'target_unit', 'scope' => 'enemy_unit', 'maxPower' => 3]]],
                ['vdm-mantle', 'Midnight Mantle', 'equipment', 2, 0, 4, 'uncommon', ['bulwark'], 'Attached unit gets +0/+4 and Bulwark.', []],
                ['vdm-bargain', 'Soul Bargain', 'action', 4, null, null, 'rare', [], 'Deal 5 damage to any unit.', [['kind' => 'damage', 'amount' => 5, 'target' => 'target_unit', 'scope' => 'any_unit']]],
            ],
            'starforge' => [
                ['sfg-scrapbot', 'Starforged Scrapbot', 'unit', 1, 1, 2, 'common', [], 'Humble beginnings.', []],
                ['sfg-courier', 'Celestial Courier', 'unit', 2, 2, 2, 'common', [], 'Gain 1 energy this turn.', [['kind' => 'gain_energy', 'count' => 1]]],
                ['sfg-drone', 'Graviton Drone', 'unit', 2, 2, 1, 'common', ['swift'], 'A needle of gravity.', []],
                ['sfg-golem', 'Astral Core Golem', 'unit', 3, 3, 3, 'common', [], 'Forged from a dead star.', []],
                ['sfg-bulwark', 'Neutron Bulwark', 'unit', 4, 2, 7, 'uncommon', ['bulwark'], 'Immovable as a collapsed star.', []],
                ['sfg-smith', 'Comet Smith', 'unit', 4, 3, 4, 'uncommon', [], 'Gain +1 max energy.', [['kind' => 'gain_max_energy', 'count' => 1]]],
                ['sfg-warden', 'Supernova Warden', 'unit', 5, 5, 4, 'rare', ['swift'], 'Ends a system in a heartbeat.', []],
                ['sfg-titan', 'Starforged Titan', 'unit', 7, 7, 7, 'rare', [], 'The forge answers.', []],
                ['sfg-colossus', 'Colossus of Dawn', 'unit', 8, 8, 8, 'epic', [], 'The first light, made walking.', []],
                ['sfg-forge', 'Solar Forge', 'action', 2, null, null, 'uncommon', [], 'Gain 2 energy this turn.', [['kind' => 'gain_energy', 'count' => 2]]],
                ['sfg-meteor', 'Meteor Shower', 'action', 3, null, null, 'rare', [], 'Deal 3 damage to a unit.', [['kind' => 'damage', 'amount' => 3, 'target' => 'target_unit', 'scope' => 'enemy_unit']]],
                ['sfg-overclock', 'Overclock', 'action', 1, null, null, 'common', [], 'A friendly unit gets +2 power this turn.', [['kind' => 'buff', 'power' => 2, 'target' => 'target_unit', 'scope' => 'friendly_unit', 'turns' => 'this_turn']]],
                ['sfg-shield', 'Prismatic Shield', 'action', 2, null, null, 'uncommon', [], 'A friendly unit gets +0/+4 this turn.', [['kind' => 'buff', 'health' => 4, 'target' => 'target_unit', 'scope' => 'friendly_unit', 'turns' => 'this_turn']]],
                ['sfg-stellar-forge', 'Stellar Forge', 'equipment', 3, 3, 3, 'rare', [], 'Attached unit gets +3/+3.', []],
                ['sfg-well', 'Gravity Well', 'action', 4, null, null, 'rare', [], 'Return a unit to its owner\'s hand.', [['kind' => 'return_to_hand', 'target' => 'target_unit', 'scope' => 'enemy_unit']]],
            ],
        ];

        $neutralCards = [
            ['neu-moth', 'Cosmic Moth', 'unit', 1, 1, 1, 'common', ['swift'], 'Follows the starlight.', []],
            ['neu-astromech', 'Wandering Astromech', 'unit', 2, 2, 3, 'common', [], 'Lost, but never late.', []],
            ['neu-rift-runner', 'Rift Runner', 'unit', 3, 3, 2, 'common', ['swift'], 'Leaps the folds of space.', []],
            ['neu-stardust', 'Stray Stardust', 'action', 1, null, null, 'common', [], 'Heal a unit 2.', [['kind' => 'heal', 'amount' => 2, 'target' => 'target_unit', 'scope' => 'any_unit']]],
            ['neu-shooting-star', 'Shooting Star', 'action', 2, null, null, 'uncommon', [], 'Deal 1 damage to all enemy units.', [['kind' => 'damage', 'amount' => 1, 'target' => 'all_enemy_units']]],
            ['neu-gravity-siphon', 'Gravity Siphon', 'action', 2, null, null, 'uncommon', [], 'Draw 1 card.', [['kind' => 'draw', 'count' => 1]]],
            ['neu-comet-fragment', 'Comet Fragment', 'equipment', 2, 1, 3, 'uncommon', [], 'Attached unit gets +1/+3.', []],
            ['neu-warp-pod', 'Warp Pod', 'action', 4, null, null, 'rare', [], 'Summon a 3/3 Warp Entity.', [['kind' => 'summon', 'defId' => 'token-warp-entity', 'count' => 1]]],
        ];

        $leaders = [
            ['leader-dawnspire', 'Sunwarden Adara', 'dawnspire', 30],
            ['leader-voidmire', 'Shade Sovereign Mirelle', 'voidmire', 30],
            ['leader-starforge', 'Starforger Halcyon', 'starforge', 30],
        ];

        foreach ($factionCards as $factionCode => $cards) {
            foreach ($cards as $card) {
                $this->createCard($set, $factions[$factionCode], $card);
            }
        }

        foreach ($neutralCards as $card) {
            $this->createCard($set, null, $card);
        }

        foreach ($leaders as [$code, $name, $factionCode, $health]) {
            Card::updateOrCreate(
                ['code' => $code],
                [
                    'set_id' => $set->id,
                    'faction_id' => $factions[$factionCode]->id,
                    'name' => $name,
                    'type' => 'leader',
                    'cost' => 0,
                    'rarity' => 'legendary',
                    'health' => $health,
                    'keywords' => [],
                    'text' => 'Your identity on the field. If this leader reaches 0 health, you lose.',
                    'effects' => [],
                    'finish' => 'aurora',
                    'frame_variant' => $factionCode.'-legendary',
                    'sort' => 0,
                ],
            );
        }
    }

    /**
     * Insert a single non-leader card.
     *
     * @param  array<int, mixed>  $row
     */
    private function createCard(CardSet $set, ?Faction $faction, array $row): void
    {
        [$code, $name, $type, $cost, $power, $health, $rarity, $keywords, $text, $effects] = $row;

        $finish = match ($rarity) {
            'rare' => 'foil',
            'epic', 'legendary' => 'prismatic',
            default => 'standard',
        };

        Card::updateOrCreate(
            ['code' => $code],
            [
                'set_id' => $set->id,
                'faction_id' => $faction?->id,
                'name' => $name,
                'type' => $type,
                'cost' => $cost,
                'rarity' => $rarity,
                'power' => $power,
                'health' => $health,
                'keywords' => $keywords,
                'text' => $text,
                'effects' => $this->normalizeEffects($effects),
                'finish' => $finish,
                'frame_variant' => ($faction?->code ?? 'neutral').'-'.$rarity,
                'sort' => 0,
            ],
        );
    }

    /**
     * Convert the compact authoring format into the engine's CardEffect shape.
     *
     * The engine expects `[{trigger: 'on_play', actions: [{kind, target}]}]`
     * with `target` as `{kind, scope}`. The seeder rows use a flat shorthand:
     * `['kind' => 'damage', 'target' => 'target_unit', 'scope' => 'enemy_unit']`.
     *
     * @param  array<int, array<string, mixed>>  $effects
     * @return array<int, array<string, mixed>>
     */
    private function normalizeEffects(array $effects): array
    {
        if ($effects === []) {
            return [];
        }

        return [
            [
                'trigger' => 'on_play',
                'actions' => array_map(
                    fn (array $action): array => $this->normalizeAction($action),
                    $effects,
                ),
            ],
        ];
    }

    /**
     * Normalize a single flat action row into the engine's EffectAction shape.
     *
     * @param  array<string, mixed>  $action
     * @return array<string, mixed>
     */
    private function normalizeAction(array $action): array
    {
        if (! isset($action['target'])) {
            return $action;
        }

        $target = $action['target'];
        $scope = $action['scope'] ?? null;
        unset($action['target'], $action['scope']);

        if ($target === 'target_unit') {
            $action['target'] = [
                'kind' => 'target_unit',
                'scope' => $scope ?? 'any_unit',
            ];
        } else {
            $action['target'] = ['kind' => $target];
        }

        return $action;
    }
}
