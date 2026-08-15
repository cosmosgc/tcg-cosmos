<?php

namespace App\Services;

use App\Models\BoosterPack;
use App\Models\Card;
use App\Models\PackOpening;
use App\Models\User;
use Random\Randomizer;

class BoosterService
{
    /**
     * The single launch booster, used until an admin configures one in the DB.
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
     * The enabled booster pack an admin configured, or null to fall back to
     * the legacy constant defaults.
     */
    public function activePack(): ?BoosterPack
    {
        return BoosterPack::query()
            ->where('enabled', true)
            ->orderBy('code')
            ->first();
    }

    /**
     * The display shape of the active pack (or the legacy defaults).
     *
     * @return array{id: string, name: string, cost: int, size: int, dropRates: array<int, array{slot: string, rates: array<int, array{rarity: string, chance: float}>}>}
     */
    public function packInfo(): array
    {
        $pack = $this->activePack();

        return [
            'id' => $pack === null ? self::PACK_ID : $pack->code,
            'name' => $pack === null ? 'Celestial Genesis Booster' : $pack->name,
            'cost' => $pack === null ? self::PACK_COST : $pack->cost,
            'size' => $pack === null ? self::PACK_SIZE : $pack->size,
            'dropRates' => $this->dropRates($pack),
        ];
    }

    /**
     * Open a booster: charge gems, generate cards from the drop table,
     * grant them to the user's inventory, and log the opening.
     *
     * @return array{granted: array<int, array{code: string, finish: string, rarity: string, quantity: int, new: bool}>, dust: int, gems: int}
     */
    public function open(User $user): array
    {
        $pack = $this->activePack();
        $cost = $pack === null ? self::PACK_COST : $pack->cost;

        if ($user->gems < $cost) {
            throw new \RuntimeException('Not enough gems to open this booster.');
        }

        $user->decrement('gems', $cost);

        $items = $this->generate($pack);

        $result = $this->inventory->grantCards($user, $items);

        PackOpening::create([
            'user_id' => $user->id,
            'pack_id' => $pack === null ? self::PACK_ID : $pack->code,
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
     * Generate a pack's contents from the drop table. Commons fill the
     * guaranteed slots, then one uncommon-or-better slot and one rare-or-
     * better slot.
     *
     * @return array<int, array{code: string, finish: string}>
     */
    public function generate(?BoosterPack $pack = null): array
    {
        $size = $pack === null ? self::PACK_SIZE : $pack->size;
        $items = [];

        for ($i = 0; $i < max(1, $size - 2); $i++) {
            $items[] = $this->pickCard('common');
        }

        $uncommon = $pack === null ? self::UNCOMMON_OR_BETTER : ($pack->drop_rates['uncommon_or_better'] ?? self::UNCOMMON_OR_BETTER);
        $rare = $pack === null ? self::RARE_OR_BETTER : ($pack->drop_rates['rare_or_better'] ?? self::RARE_OR_BETTER);

        $items[] = $this->pickCard($this->weightedRarity($uncommon));
        $items[] = $this->pickCard($this->weightedRarity($rare));

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

    /**
     * Human-readable drop rates for the UI, following the same slot layout
     * the generator uses.
     *
     * @return array<int, array{slot: string, rates: array<int, array{rarity: string, chance: float}>}>
     */
    private function dropRates(?BoosterPack $pack): array
    {
        $uncommon = $pack === null ? self::UNCOMMON_OR_BETTER : ($pack->drop_rates['uncommon_or_better'] ?? self::UNCOMMON_OR_BETTER);
        $rare = $pack === null ? self::RARE_OR_BETTER : ($pack->drop_rates['rare_or_better'] ?? self::RARE_OR_BETTER);
        $size = $pack === null ? self::PACK_SIZE : $pack->size;

        $slots = [
            'common' => ['common' => max(1, $size - 2)],
            'uncommon or better' => $uncommon,
            'rare or better' => $rare,
        ];

        $rates = [];

        foreach ($slots as $slot => $weights) {
            $total = array_sum($weights);

            $slotRates = [];

            foreach ($weights as $rarity => $weight) {
                $slotRates[] = [
                    'rarity' => $rarity,
                    'chance' => round(($weight / $total) * 100, 1),
                ];
            }

            $rates[] = [
                'slot' => $slot,
                'rates' => $slotRates,
            ];
        }

        return $rates;
    }
}
