<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BoosterPack;
use App\Models\CardSet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BoosterPackController extends Controller
{
    /**
     * List every booster pack definition.
     */
    public function index(): Response
    {
        $packs = BoosterPack::with('set')
            ->orderBy('enabled', 'desc')
            ->orderBy('code')
            ->get()
            ->map(fn (BoosterPack $pack): array => [
                'id' => $pack->id,
                'code' => $pack->code,
                'name' => $pack->name,
                'set' => $pack->set?->name,
                'cost' => $pack->cost,
                'size' => $pack->size,
                'enabled' => $pack->enabled,
                'updated_at' => $pack->updated_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/boosters/index', [
            'packs' => $packs,
        ]);
    }

    /**
     * Render the create-booster form.
     */
    public function create(): Response
    {
        return $this->form();
    }

    /**
     * Render the edit-booster form, pre-filled with the pack's data.
     */
    public function edit(BoosterPack $pack): Response
    {
        return $this->form($pack);
    }

    /**
     * Create a new booster pack.
     */
    public function store(Request $request): RedirectResponse
    {
        BoosterPack::create($this->validated($request));

        return redirect()->route('admin.boosters.index');
    }

    /**
     * Update an existing booster pack.
     */
    public function update(Request $request, BoosterPack $pack): RedirectResponse
    {
        $pack->update($this->validated($request));

        return redirect()->route('admin.boosters.index');
    }

    /**
     * Delete a booster pack definition.
     */
    public function destroy(BoosterPack $pack): RedirectResponse
    {
        $pack->delete();

        return redirect()->route('admin.boosters.index');
    }

    /**
     * Shared data for the create/edit forms.
     */
    private function form(?BoosterPack $pack = null): Response
    {
        $sets = CardSet::orderBy('name')->get()->map(fn (CardSet $set): array => [
            'id' => $set->id,
            'code' => $set->code,
            'name' => $set->name,
        ]);

        return Inertia::render('admin/boosters/edit', [
            'pack' => $pack ? [
                'id' => $pack->id,
                'code' => $pack->code,
                'set_id' => $pack->set_id,
                'name' => $pack->name,
                'cost' => $pack->cost,
                'size' => $pack->size,
                'drop_rates' => $pack->drop_rates,
                'enabled' => $pack->enabled,
            ] : null,
            'sets' => $sets,
        ]);
    }

    /**
     * Validate the booster form payload.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:60', Rule::unique('booster_packs', 'code')->ignore($request->route('pack'))],
            'set_id' => ['nullable', 'integer', 'exists:card_sets,id'],
            'name' => ['required', 'string', 'max:80'],
            'cost' => ['required', 'integer', 'min:1', 'max:1000000'],
            'size' => ['required', 'integer', 'min:3', 'max:12'],
            'drop_rates' => ['required', 'json'],
            'enabled' => ['nullable', 'boolean'],
        ]);

        return [
            'code' => $data['code'],
            'set_id' => isset($data['set_id']) && $data['set_id'] ? (int) $data['set_id'] : null,
            'name' => $data['name'],
            'cost' => (int) $data['cost'],
            'size' => (int) $data['size'],
            'drop_rates' => json_decode($data['drop_rates'], true),
            'enabled' => filter_var($data['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
