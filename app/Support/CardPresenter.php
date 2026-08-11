<?php

namespace App\Support;

use App\Models\Card;

class CardPresenter
{
    /**
     * Map a Card model to the CardDef shape consumed by the TS engine and UI.
     *
     * @return array<string, mixed>
     */
    public static function toDef(Card $card): array
    {
        return [
            'id' => $card->code,
            'set' => $card->set?->code ?? 'celestial-genesis',
            'faction' => $card->faction?->code ?? 'neutral',
            'name' => $card->name,
            'type' => $card->type,
            'rarity' => $card->rarity,
            'cost' => $card->cost,
            'power' => $card->power,
            'health' => $card->health,
            'keywords' => $card->keywords,
            'text' => $card->text,
            'effects' => $card->effects,
            'finish' => $card->finish,
            'frameVariant' => $card->frame_variant ?? $card->rarity,
            'artUrl' => $card->art_url,
        ];
    }
}
