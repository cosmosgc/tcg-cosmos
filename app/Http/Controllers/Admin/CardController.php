<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\CardSet;
use App\Models\Faction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CardController extends Controller
{
    /**
     * List every card with the admin-facing metadata.
     */
    public function index(): Response
    {
        $cards = Card::with('set', 'faction')
            ->orderBy('faction_id')
            ->orderBy('sort')
            ->orderBy('cost')
            ->get()
            ->map(fn (Card $card): array => [
                'id' => $card->id,
                'code' => $card->code,
                'name' => $card->name,
                'type' => $card->type,
                'cost' => $card->cost,
                'rarity' => $card->rarity,
                'faction' => $card->faction?->name,
                'factionCode' => $card->faction?->code,
                'set' => $card->set?->name,
                'setCode' => $card->set?->code,
                'power' => $card->power,
                'health' => $card->health,
                'hasArt' => $card->art_url !== null,
                'artUrl' => $card->artUrl(),
            ]);

        return Inertia::render('admin/cards/index', [
            'cards' => $cards,
        ]);
    }

    /**
     * Render the create-card form.
     */
    public function create(): Response
    {
        return $this->form();
    }

    /**
     * Render the edit-card form, pre-filled with the card's data.
     */
    public function edit(Card $card): Response
    {
        return $this->form($card);
    }

    /**
     * Create a new card.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $card = Card::create([
            'code' => $data['code'],
            'set_id' => $data['set_id'],
            'faction_id' => $data['faction_id'],
            'name' => $data['name'],
            'type' => $data['type'],
            'cost' => $data['cost'],
            'rarity' => $data['rarity'],
            'power' => $data['power'],
            'health' => $data['health'],
            'keywords' => $data['keywords'],
            'text' => $data['text'],
            'effects' => $data['effects'],
            'finish' => $data['finish'],
            'frame_variant' => $data['frame_variant'],
            'sort' => $data['sort'],
        ]);

        $this->saveArt($request, $card);

        return redirect()->route('admin.cards.index');
    }

    /**
     * Update an existing card.
     */
    public function update(Request $request, Card $card): RedirectResponse
    {
        $data = $this->validated($request);

        $card->update([
            'code' => $data['code'],
            'set_id' => $data['set_id'],
            'faction_id' => $data['faction_id'],
            'name' => $data['name'],
            'type' => $data['type'],
            'cost' => $data['cost'],
            'rarity' => $data['rarity'],
            'power' => $data['power'],
            'health' => $data['health'],
            'keywords' => $data['keywords'],
            'text' => $data['text'],
            'effects' => $data['effects'],
            'finish' => $data['finish'],
            'frame_variant' => $data['frame_variant'],
            'sort' => $data['sort'],
        ]);

        $this->saveArt($request, $card);

        return redirect()->route('admin.cards.index');
    }

    /**
     * Delete a card and its uploaded art.
     */
    public function destroy(Card $card): RedirectResponse
    {
        if ($card->art_url) {
            Storage::disk('public')->delete($card->art_url);
        }

        $card->delete();

        return redirect()->route('admin.cards.index');
    }

    /**
     * Shared data for the create/edit forms.
     */
    private function form(?Card $card = null): Response
    {
        $sets = CardSet::orderBy('name')->get()->map(fn (CardSet $set): array => [
            'id' => $set->id,
            'code' => $set->code,
            'name' => $set->name,
        ]);

        $factions = Faction::orderBy('name')->get()->map(fn (Faction $faction): array => [
            'id' => $faction->id,
            'code' => $faction->code,
            'name' => $faction->name,
            'color' => $faction->color,
        ]);

        return Inertia::render('admin/cards/edit', [
            'card' => $card ? [
                'id' => $card->id,
                'code' => $card->code,
                'set_id' => $card->set_id,
                'faction_id' => $card->faction_id,
                'name' => $card->name,
                'type' => $card->type,
                'cost' => $card->cost,
                'rarity' => $card->rarity,
                'power' => $card->power,
                'health' => $card->health,
                'keywords' => $card->keywords,
                'text' => $card->text,
                'effects' => $card->effects,
                'finish' => $card->finish,
                'frame_variant' => $card->frame_variant,
                'sort' => $card->sort,
                'art_url' => $card->art_url,
                'artUrl' => $card->artUrl(),
            ] : null,
            'sets' => $sets,
            'factions' => $factions,
        ]);
    }

    /**
     * Validate the card form payload.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $rules = [
            'code' => ['required', 'string', 'max:60', Rule::unique('cards', 'code')->ignore($request->route('card'))],
            'set_id' => ['nullable', 'integer', 'exists:card_sets,id'],
            'faction_id' => ['nullable', 'integer', 'exists:factions,id'],
            'name' => ['required', 'string', 'max:80'],
            'type' => ['required', Rule::in(['unit', 'action', 'equipment', 'leader'])],
            'cost' => ['required', 'integer', 'min:0', 'max:20'],
            'rarity' => ['required', Rule::in(['common', 'uncommon', 'rare', 'epic', 'legendary'])],
            'power' => ['nullable', 'integer', 'min:0', 'max:999'],
            'health' => ['nullable', 'integer', 'min:0', 'max:999'],
            'keywords' => ['present', 'array'],
            'keywords.*' => ['string', 'max:30'],
            'text' => ['nullable', 'string', 'max:500'],
            'effects' => ['nullable', 'json'],
            'finish' => ['required', Rule::in(['standard', 'foil', 'prismatic', 'aurora', 'etched'])],
            'frame_variant' => ['nullable', 'string', 'max:60'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'art' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_art' => ['nullable', 'boolean'],
        ];

        $data = $request->validate($rules);

        return [
            'code' => $data['code'],
            'set_id' => isset($data['set_id']) && $data['set_id'] ? (int) $data['set_id'] : null,
            'faction_id' => isset($data['faction_id']) && $data['faction_id'] ? (int) $data['faction_id'] : null,
            'name' => $data['name'],
            'type' => $data['type'],
            'cost' => (int) $data['cost'],
            'rarity' => $data['rarity'],
            'power' => $data['power'] !== null ? (int) $data['power'] : null,
            'health' => $data['health'] !== null ? (int) $data['health'] : null,
            'keywords' => array_values($data['keywords']),
            'text' => $data['text'],
            'effects' => $data['effects'] ? json_decode($data['effects'], true) : [],
            'finish' => $data['finish'],
            'frame_variant' => $data['frame_variant'],
            'sort' => (int) ($data['sort'] ?? 0),
        ];
    }

    /**
     * Persist an uploaded art file for a card, removing the previous image
     * when replaced or explicitly cleared.
     */
    private function saveArt(Request $request, Card $card): void
    {
        if ($request->boolean('remove_art') || $request->hasFile('art')) {
            if ($card->art_url) {
                Storage::disk('public')->delete($card->art_url);
            }

            $card->art_url = null;
        }

        if ($request->hasFile('art')) {
            $path = $request->file('art')->storeAs(
                'card-art',
                $card->code.'.'.$request->file('art')->getClientOriginalExtension(),
                'public',
            );

            if ($path !== false) {
                $card->art_url = $path;
            }
        }

        $card->save();
    }
}
