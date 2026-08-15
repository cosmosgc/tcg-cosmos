<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserQuest;
use RuntimeException;

class QuestService
{
    /**
     * The three simple launch quests, keyed by machine key.
     *
     * @var array<string, array{name: string, description: string, target: int, gems: int, dust: int}>
     */
    public const QUESTS = [
        'play_match' => [
            'name' => 'First Battle',
            'description' => 'Finish your first hot-seat match.',
            'target' => 1,
            'gems' => 0,
            'dust' => 100,
        ],
        'open_pack' => [
            'name' => 'Pack Opener',
            'description' => 'Open one Celestial Genesis booster.',
            'target' => 1,
            'gems' => 50,
            'dust' => 0,
        ],
        'save_deck' => [
            'name' => 'Deck Builder',
            'description' => 'Save a legal 30-card deck.',
            'target' => 1,
            'gems' => 0,
            'dust' => 150,
        ],
    ];

    /**
     * Record progress toward a quest for a user. Non-existent quest keys are
     * ignored so optional call sites stay safe.
     */
    public function track(User $user, string $key, int $amount = 1): void
    {
        if (! isset(self::QUESTS[$key])) {
            return;
        }

        $quest = $this->row($user, $key);

        if ($quest->isComplete() || $quest->isClaimed()) {
            return;
        }

        $quest->progress = min($quest->target, $quest->progress + $amount);
        $quest->save();
    }

    /**
     * Grant the reward of a completed, unclaimed quest. Throws when the quest
     * is unknown, incomplete, or already claimed.
     */
    public function claim(User $user, string $key): void
    {
        $definition = self::QUESTS[$key] ?? throw new RuntimeException("Unknown quest \"{$key}\".");

        $quest = $this->row($user, $key);

        if (! $quest->isComplete()) {
            throw new RuntimeException('This quest is not finished yet.');
        }

        if ($quest->isClaimed()) {
            throw new RuntimeException('This reward has already been claimed.');
        }

        $user->update([
            'gems' => $user->gems + $definition['gems'],
            'dust' => $user->dust + $definition['dust'],
        ]);
        $quest->update(['claimed_at' => now()]);
    }

    /**
     * The full quest board for the dashboard: progress, completion, and claim
     * state for every defined quest.
     *
     * @return array<int, array{key: string, name: string, description: string, progress: int, target: int, complete: bool, claimed: bool, gems: int, dust: int}>
     */
    public function statusFor(User $user): array
    {
        $rows = UserQuest::where('user_id', $user->id)
            ->get()
            ->keyBy('key');

        $status = [];

        foreach (self::QUESTS as $key => $definition) {
            $row = $rows[$key] ?? null;

            $status[] = [
                'key' => $key,
                'name' => $definition['name'],
                'description' => $definition['description'],
                'progress' => $row->progress ?? 0,
                'target' => $definition['target'],
                'complete' => $row !== null && $row->isComplete(),
                'claimed' => $row?->isClaimed() ?? false,
                'gems' => $definition['gems'],
                'dust' => $definition['dust'],
            ];
        }

        return $status;
    }

    /**
     * Find-or-create the progress row for a user and quest.
     */
    private function row(User $user, string $key): UserQuest
    {
        return UserQuest::firstOrCreate(
            ['user_id' => $user->id, 'key' => $key],
            ['target' => self::QUESTS[$key]['target']],
        );
    }
}
