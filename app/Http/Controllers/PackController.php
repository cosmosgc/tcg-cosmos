<?php

namespace App\Http\Controllers;

use App\Services\BoosterService;
use App\Services\QuestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PackController extends Controller
{
    public function __construct(
        private readonly BoosterService $booster,
        private readonly QuestService $quests,
    ) {}

    /**
     * Render the booster-opening screen.
     */
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('packs', [
            'pack' => $this->booster->packInfo(),
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

        $this->quests->track($user, 'open_pack');

        return Inertia::render('packs', [
            'pack' => $this->booster->packInfo(),
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
}
