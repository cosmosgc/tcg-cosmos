<?php

namespace App\Http\Controllers;

use App\Services\BoosterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PackController extends Controller
{
    public function __construct(
        private readonly BoosterService $booster,
    ) {}

    /**
     * Render the booster-opening screen.
     */
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('packs', [
            'pack' => [
                'id' => BoosterService::PACK_ID,
                'name' => 'Celestial Genesis Booster',
                'cost' => BoosterService::PACK_COST,
                'size' => BoosterService::PACK_SIZE,
                'dropRates' => $this->dropRates(),
            ],
            'wallet' => [
                'gems' => $user->gems,
                'dust' => $user->dust,
            ],
            'lastOpening' => null,
        ]);
    }

    /**
     * Open a booster server-side and grant the cards before the reveal.
     */
    public function open(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        try {
            $opening = $this->booster->open($user);
        } catch (\RuntimeException $exception) {
            return back()->withErrors(['pack' => $exception->getMessage()]);
        }

        return Inertia::render('packs', [
            'pack' => [
                'id' => BoosterService::PACK_ID,
                'name' => 'Celestial Genesis Booster',
                'cost' => BoosterService::PACK_COST,
                'size' => BoosterService::PACK_SIZE,
                'dropRates' => $this->dropRates(),
            ],
            'wallet' => [
                'gems' => $opening['gems'],
                'dust' => $user->fresh()->dust,
            ],
            'lastOpening' => [
                'cards' => $opening['granted'],
                'dust' => $opening['dust'],
                'openedAt' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Human-readable drop rates for the UI.
     *
     * @return array<int, array{slot: string, rates: array<int, array{rarity: string, chance: float}>}>
     */
    private function dropRates(): array
    {
        $slots = [
            'common' => [
                'common' => BoosterService::PACK_SIZE - 2,
            ],
            'uncommon or better' => BoosterService::UNCOMMON_OR_BETTER,
            'rare or better' => BoosterService::RARE_OR_BETTER,
        ];

        $rates = [];

        foreach ($slots as $slot => $weights) {
            $total = array_sum($weights);

            $slotRates = [];

            foreach ($weights as $rarity => $weight) {
                $slotRates[] = [
                    'rarity' => $rarity,
                    'chance' => round(($weight / $total) * 100, 1),
                ];
            }

            $rates[] = [
                'slot' => $slot,
                'rates' => $slotRates,
            ];
        }

        return $rates;
    }
}
