<?php

namespace App\Services;

use App\Models\Card;
use App\Models\User;

class StarterCollection
{
    /**
     * Starting gems a fresh account can spend on boosters.
     */
    public const STARTING_GEMS = 500;

    /**
     * Grant a new player a first collection: full common/uncommon playsets,
     * one of each leader, and enough gems for a few boosters.
     */
    public function grant(User $user): void
    {
        if ($user->cards()->exists()) {
            return;
        }

        $cards = Card::query()
            ->whereIn('rarity', ['common', 'uncommon'])
            ->orWhere('type', 'leader')
            ->get();

        $items = [];

        foreach ($cards as $card) {
            $copies = $card->type === 'leader' ? 1 : 3;

            for ($i = 0; $i < $copies; $i++) {
                $items[] = ['code' => $card->code];
            }
        }

        app(InventoryService::class)->grantCards($user, $items);

        $user->increment('gems', self::STARTING_GEMS);
    }
}
