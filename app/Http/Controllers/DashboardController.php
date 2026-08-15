<?php

namespace App\Http\Controllers;

use App\Services\QuestService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly QuestService $quests,
    ) {}

    /**
     * Render the dashboard with the quest board and wallet.
     */
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('dashboard', [
            'quests' => $this->quests->statusFor($user),
            'wallet' => [
                'gems' => $user->gems,
                'dust' => $user->dust,
            ],
        ]);
    }
}
