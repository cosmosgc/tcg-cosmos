<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Deck;
use App\Models\Faction;
use App\Services\DeckRules;
use App\Services\InventoryService;
use App\Support\CardPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeckController extends Controller
{
    public function __construct(
        private readonly DeckRules $rules,
        private readonly InventoryService $inventory,
    ) {}

    /**
     * List the current user's saved decks.
     */
    public function index(): Response
    {
        $decks = Deck::query()
            ->where('user_id', auth()->id())
            ->with('leader')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn (Deck $deck): array => [
                'id' => $deck->id,
                'name' => $deck->name,
                'leaderCode' => $deck->leader_card_code,
                'leaderName' => $deck->leader?->name,
                'cardCount' => count($deck->cards) + 1,
            ]);

        return Inertia::render('decks/index', [
            'decks' => $decks,
        ]);
    }

    /**
     * Render the deck builder, optionally pre-filled with an existing deck.
     */
    public function edit(?Deck $deck = null): Response
    {
        abort_if(
            $deck->exists && $deck->user_id !== auth()->id(),
            403,
        );

        $cards = Card::with('faction')
            ->orderBy('faction_id')
            ->orderBy('sort')
            ->orderBy('cost')
            ->get()
            ->map(CardPresenter::toDef(...));

        $owned = $this->inventory->ownedQuantities(auth()->user());

        $factions = Faction::all()->map(fn (Faction $faction): array => [
            'id' => $faction->code,
            'name' => $faction->name,
            'color' => $faction->color,
            'description' => $faction->description,
            'playStyle' => $faction->playstyle,
        ]);

        return Inertia::render('decks/editor', [
            'cards' => $cards,
            'owned' => $owned,
            'factions' => $factions,
            'deck' => $deck->exists ? [
                'id' => $deck->id,
                'name' => $deck->name,
                'leaderCode' => $deck->leader_card_code,
                'cards' => $deck->cards,
            ] : null,
        ]);
    }

    /**
     * Save a new deck.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $error = $this->rules->validate(
            $request->user(),
            $data['leaderCardCode'],
            $data['cards'],
        );

        if ($error) {
            return back()->withErrors(['deck' => $error]);
        }

        Deck::create([
            'user_id' => $request->user()->id,
            'name' => $data['name'],
            'leader_card_code' => $data['leaderCardCode'],
            'cards' => $data['cards'],
        ]);

        return redirect()->route('decks.index');
    }

    /**
     * Update an existing deck.
     */
    public function update(Request $request, Deck $deck): RedirectResponse
    {
        abort_if($deck->user_id !== $request->user()->id, 403);

        $data = $this->validated($request);

        $error = $this->rules->validate(
            $request->user(),
            $data['leaderCardCode'],
            $data['cards'],
        );

        if ($error) {
            return back()->withErrors(['deck' => $error]);
        }

        $deck->update([
            'name' => $data['name'],
            'leader_card_code' => $data['leaderCardCode'],
            'cards' => $data['cards'],
        ]);

        return redirect()->route('decks.index');
    }

    /**
     * Delete a deck.
     */
    public function destroy(Request $request, Deck $deck): RedirectResponse
    {
        abort_if($deck->user_id !== $request->user()->id, 403);

        $deck->delete();

        return redirect()->route('decks.index');
    }

    /**
     * Validate the deck payload from the builder.
     *
     * @return array{name: string, leaderCardCode: string, cards: array<int, string>}
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'leaderCardCode' => ['required', 'string'],
            'cards' => ['required', 'array'],
            'cards.*' => ['required', 'string'],
        ]);

        return [
            'name' => $data['name'],
            'leaderCardCode' => $data['leaderCardCode'],
            'cards' => array_values($data['cards']),
        ];
    }
}
