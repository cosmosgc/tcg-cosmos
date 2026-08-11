<?php

namespace App\Services;

use App\Models\Card;
use App\Models\User;
use App\Models\UserCard;
use Illuminate\Support\Collection;

class InventoryService
{
    /**
     * Maximum owned copies of a single card before duplicates convert to dust.
     */
    public const COPY_LIMIT = 3;

    /**
     * Dust value granted for a duplicate copy, by card rarity.
     *
     * @var array<string, int>
     */
    public const DUST_BY_RARITY = [
        'common' => 5,
        'uncommon' => 15,
        'rare' => 40,
        'epic' => 100,
        'legendary' => 250,
    ];

    /**
     * Grant copies of a card to a user, converting any copy beyond the limit
     * into dust. Returns a summary of what was granted.
     *
     * @param  array<int, array{code: string, finish?: string}>  $items
     * @return array{granted: array<int, array{code: string, finish: string, rarity: string, quantity: int, new: bool}>, dust: int}
     */
    public function grantCards(User $user, array $items): array
    {
        $codes = array_values(array_unique(array_map(
            static fn (array $item): string => $item['code'],
            $items,
        )));

        $cards = Card::whereIn('code', $codes)->get()->keyBy('code');
        $granted = [];
        $dust = 0;

        foreach ($items as $item) {
            $card = $cards[$item['code']] ?? null;

            if (! $card) {
                continue;
            }

            $finish = $item['finish'] ?? $card->finish;
            $entry = UserCard::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'card_id' => $card->id,
                    'finish' => $finish,
                ],
                ['quantity' => 0],
            );

            if ($entry->quantity >= self::COPY_LIMIT) {
                $dust += self::DUST_BY_RARITY[$card->rarity] ?? 0;

                continue;
            }

            $entry->increment('quantity');
            $granted[] = [
                'code' => $card->code,
                'finish' => $finish,
                'rarity' => $card->rarity,
                'quantity' => $entry->quantity,
                'new' => $entry->quantity === 1,
            ];
        }

        if ($dust > 0) {
            $user->increment('dust', $dust);
        }

        return ['granted' => $granted, 'dust' => $dust];
    }

    /**
     * Total owned copies per card code (summed across finishes).
     *
     * @return Collection<string, int>
     */
    public function ownedQuantities(User $user): Collection
    {
        return UserCard::query()
            ->where('user_id', $user->id)
            ->with('card')
            ->get()
            ->groupBy(fn (UserCard $entry): string => $entry->card->code)
            ->map(
                fn (Collection $entries): int => (int) $entries->sum(
                    fn (UserCard $entry): int => $entry->quantity,
                ),
            );
    }
}
