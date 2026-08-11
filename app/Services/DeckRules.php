<?php

namespace App\Services;

use App\Models\Card;
use App\Models\User;

class DeckRules
{
    /**
     * Exact number of cards in a deck, including the leader.
     */
    public const DECK_SIZE = 30;

    /**
     * Maximum copies of a single card in a deck.
     */
    public const COPY_LIMIT = 3;

    /**
     * Validate a deck against the game rules. Returns an error message, or
     * null when the deck is legal.
     *
     * @param  array<int, string>  $cards
     */
    public function validate(User $user, string $leaderCode, array $cards): ?string
    {
        $leader = Card::where('code', $leaderCode)->first();

        if (! $leader || $leader->type !== 'leader') {
            return 'Choose a valid faction leader.';
        }

        $owned = $this->ownedQuantities($user);

        $total = count($cards) + 1;

        if ($total !== self::DECK_SIZE) {
            return sprintf(
                'Decks must contain exactly %d cards (currently %d).',
                self::DECK_SIZE,
                $total,
            );
        }

        $counts = array_count_values($cards);

        foreach ($counts as $code => $count) {
            if ($count > self::COPY_LIMIT) {
                return sprintf(
                    'You can include at most %d copies of "%s".',
                    self::COPY_LIMIT,
                    $code,
                );
            }

            $card = Card::where('code', $code)->first();

            if (! $card) {
                return "Unknown card \"{$code}\".";
            }

            if ($card->type === 'leader') {
                return 'Leaders cannot be added twice.';
            }

            if ($card->faction && $card->faction->code !== 'neutral' && $card->faction->code !== $leader->faction?->code) {
                return "{$card->name} does not belong to your leader's faction.";
            }

            if (($owned[$code] ?? 0) < $count) {
                return sprintf(
                    'You do not own enough copies of "%s" (%d/%d).',
                    $card->name,
                    $owned[$code] ?? 0,
                    $count,
                );
            }
        }

        return null;
    }

    /**
     * @return array<string, int>
     */
    private function ownedQuantities(User $user): array
    {
        return app(InventoryService::class)
            ->ownedQuantities($user)
            ->all();
    }
}
