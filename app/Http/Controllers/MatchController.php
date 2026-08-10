<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Faction;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    /**
     * Render the hot-seat match screen with the game data needed to build decks.
     */
    public function index(): Response
    {
        $cards = Card::with('set', 'faction')
            ->orderBy('faction_id')
            ->orderBy('sort')
            ->orderBy('cost')
            ->get()
            ->map(fn (Card $card): array => [
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
            ]);

        $factions = Faction::all()->map(fn (Faction $faction): array => [
            'id' => $faction->code,
            'name' => $faction->name,
            'color' => $faction->color,
            'description' => $faction->description,
            'playStyle' => $faction->playstyle,
        ]);

        return Inertia::render('match', [
            'factions' => $factions,
            'cards' => $cards,
        ]);
    }
}
