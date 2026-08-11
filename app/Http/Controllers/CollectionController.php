<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Faction;
use App\Services\InventoryService;
use App\Support\CardPresenter;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory,
    ) {}

    /**
     * Render the card catalogue with the user's owned quantities.
     */
    public function index(): Response
    {
        $user = auth()->user();

        $cards = Card::with('set', 'faction')
            ->orderBy('faction_id')
            ->orderBy('sort')
            ->orderBy('cost')
            ->get()
            ->map(CardPresenter::toDef(...));

        $owned = $this->inventory->ownedQuantities($user);

        $factions = Faction::all()->map(fn (Faction $faction): array => [
            'id' => $faction->code,
            'name' => $faction->name,
            'color' => $faction->color,
            'description' => $faction->description,
            'playStyle' => $faction->playstyle,
        ]);

        return Inertia::render('collection', [
            'cards' => $cards,
            'owned' => $owned,
            'factions' => $factions,
            'wallet' => [
                'gems' => $user->gems,
                'dust' => $user->dust,
            ],
        ]);
    }
}
