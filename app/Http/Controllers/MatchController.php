<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Faction;
use App\Support\CardPresenter;
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
            ->map(CardPresenter::toDef(...));

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
