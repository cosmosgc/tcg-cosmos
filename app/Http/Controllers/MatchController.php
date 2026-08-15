<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Faction;
use App\Services\QuestService;
use App\Support\CardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function __construct(
        private readonly QuestService $quests,
    ) {}

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

    /**
     * Record that the user finished a hot-seat match to advance the
     * "first battle" quest.
     */
    public function complete(Request $request): RedirectResponse
    {
        $this->quests->track($request->user(), 'play_match');

        return back();
    }
}
