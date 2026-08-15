<?php

namespace App\Http\Controllers;

use App\Services\QuestService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class QuestController extends Controller
{
    public function __construct(
        private readonly QuestService $quests,
    ) {}

    /**
     * Claim the reward of a completed quest.
     */
    public function claim(Request $request, string $quest): RedirectResponse
    {
        try {
            $this->quests->claim($request->user(), $quest);
        } catch (\RuntimeException $exception) {
            return back()->withErrors(['quest' => $exception->getMessage()]);
        }

        return back();
    }
}
