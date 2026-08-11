<?php

namespace App\Services;

use App\Models\Card;
use App\Models\PackOpening;
use App\Models\User;
use Random\Randomizer;

class BoosterService
{
    /**
     * The single launch booster.
     */
    public const PACK_ID = 'celestial-genesis';

    /**
     * Version of the reward tables below; bump when drop rates change so
     * pack openings stay auditable.
     */
    public const REWARD_TABLE_VERSION = '1.0';

    /**
     * Cost of a pack in gems.
     */
    public const PACK_COST = 100;

    /**
     * How many cards a pack contains.
     */
    public const PACK_SIZE = 5;

    /**
     * Weighted rarities for the "uncommon or better" slot.
     *
     * @var array<string, int>
     */
    public const UNCOMMON_OR_BETTER = [
        'uncommon' => 60,
        'rare' => 30,
        'epic' => 8,
        'legendary' => 2,
    ];

    /**
     * Weighted rarities for the "rare or better" slot.
     *
     * @var array<string, int>
     */
    public const RARE_OR_BETTER = [
        'rare' => 65,
        'epic' => 28,
        'legendary' => 7,
    ];

    public function __construct(
        private readonly InventoryService $inventory,
        private readonly ?Randomizer $randomizer = null,
    ) {}

    /**
     * Open a booster: charge gems, generate cards from the drop table,
     * grant them to the user's inventory, and log the opening.
     *
     * @return array{granted: array<int, array{code: string, finish: string, rarity: string, quantity: int, new: bool}>, dust: int, gems: int}
     */
    public function open(User $user): array
    {
        if ($user->gems < self::PACK_COST) {
            throw new \RuntimeException('Not enough gems to open this booster.');
        }

        $user->decrement('gems', self::PACK_COST);

        $items = $this->generate();

        $result = $this->inventory->grantCards($user, $items);

        PackOpening::create([
            'user_id' => $user->id,
            'pack_id' => self::PACK_ID,
            'reward_table_version' => self::REWARD_TABLE_VERSION,
            'cards' => $this->auditLog($items, $result['granted']),
            'dust_gained' => $result['dust'],
        ]);

        return [
            'granted' => $result['granted'],
            'dust' => $result['dust'],
            'gems' => $user->fresh()->gems,
        ];
    }

    /**
     * Build the auditable pack record: every generated card plus whether it
     * was granted to inventory (or converted to dust as a duplicate).
     *
     * @param  array<int, array{code: string, finish: string}>  $items
     * @param  array<int, array{code: string, finish: string}>  $granted
     * @return array<int, array{code: string, finish: string, granted: bool}>
     */
    private function auditLog(array $items, array $granted): array
    {
        $grantedKeys = [];

        foreach ($granted as $copy) {
            $grantedKeys[$copy['code'].'|'.$copy['finish']] = true;
        }

        return array_map(
            fn (array $item): array => [
                'code' => $item['code'],
                'finish' => $item['finish'],
                'granted' => isset($grantedKeys[$item['code'].'|'.$item['finish']]),
            ],
            $items,
        );
    }

    /**
     * Generate a pack's contents from the drop table. Always returns exactly
     * PACK_SIZE cards: commons fill the guaranteed slots, then one uncommon-or-
     * better slot and one rare-or-better slot.
     *
     * @return array<int, array{code: string, finish: string}>
     */
    public function generate(): array
    {
        $items = [];

        for ($i = 0; $i < self::PACK_SIZE - 2; $i++) {
            $items[] = $this->pickCard('common');
        }

        $items[] = $this->pickCard($this->weightedRarity(self::UNCOMMON_OR_BETTER));
        $items[] = $this->pickCard($this->weightedRarity(self::RARE_OR_BETTER));

        return $items;
    }

    /**
     * Pick a random card code of the given rarity, applying the premium
     * finish upgrade chance for rare-or-better cards.
     *
     * @return array{code: string, finish: string}
     */
    private function pickCard(string $rarity): array
    {
        $card = Card::query()
            ->where('type', '!=', 'leader')
            ->where('rarity', $rarity)
            ->inRandomOrder()
            ->first();

        if (! $card) {
            throw new \RuntimeException("No {$rarity} cards in the set.");
        }

        return [
            'code' => $card->code,
            'finish' => $this->finishFor($rarity),
        ];
    }

    /**
     * Pick a rarity from a weighted table.
     *
     * @param  array<string, int>  $table
     */
    private function weightedRarity(array $table): string
    {
        $total = array_sum($table);
        $roll = $this->randomizer !== null
            ? $this->randomizer->getInt(1, $total)
            : random_int(1, $total);

        foreach ($table as $rarity => $weight) {
            $roll -= $weight;

            if ($roll <= 0) {
                return $rarity;
            }
        }

        return array_key_last($table) ?: 'uncommon';
    }

    /**
     * Decide the finish for a generated card: rare-or-better cards get a
     * small chance to upgrade to a premium finish.
     */
    private function finishFor(string $rarity): string
    {
        $base = match ($rarity) {
            'rare' => 'foil',
            'epic', 'legendary' => 'prismatic',
            default => 'standard',
        };

        $chance = $this->randomizer !== null
            ? $this->randomizer->getInt(1, 100)
            : random_int(1, 100);

        if ($rarity === 'epic' || $rarity === 'legendary') {
            return $chance <= 20 ? 'aurora' : $base;
        }

        if ($rarity === 'rare') {
            return $chance <= 15 ? 'prismatic' : $base;
        }

        return $base;
    }
}
