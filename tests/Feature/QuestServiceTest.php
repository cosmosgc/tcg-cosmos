<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserQuest;
use App\Services\QuestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_tracking_progress_toward_a_quest(): void
    {
        $user = User::factory()->create();

        app(QuestService::class)->track($user, 'play_match');

        $this->assertDatabaseHas('user_quests', [
            'user_id' => $user->id,
            'key' => 'play_match',
            'progress' => 1,
        ]);

        $quest = UserQuest::first();
        $this->assertTrue($quest->isComplete());
    }

    public function test_tracking_is_capped_at_the_target(): void
    {
        $user = User::factory()->create();

        app(QuestService::class)->track($user, 'save_deck');
        app(QuestService::class)->track($user, 'save_deck');

        $quest = UserQuest::where('key', 'save_deck')->firstOrFail();
        $this->assertSame(1, $quest->progress);
        $this->assertTrue($quest->isComplete());
    }

    public function test_tracking_unknown_keys_is_ignored(): void
    {
        $user = User::factory()->create();

        app(QuestService::class)->track($user, 'no_such_quest');

        $this->assertDatabaseCount('user_quests', 0);
    }

    public function test_claim_grants_reward_and_marks_claimed(): void
    {
        $user = User::factory()->create();
        $quests = app(QuestService::class);

        $quests->track($user, 'save_deck');
        $quests->claim($user, 'save_deck');

        $this->assertSame(150, $user->fresh()->dust);
        $quest = UserQuest::where('key', 'save_deck')->firstOrFail();
        $this->assertNotNull($quest->claimed_at);
    }

    public function test_claiming_an_incomplete_quest_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not finished');

        app(QuestService::class)->claim($user, 'play_match');
    }

    public function test_claiming_twice_is_rejected(): void
    {
        $user = User::factory()->create();
        $quests = app(QuestService::class);

        $quests->track($user, 'open_pack');
        $quests->claim($user, 'open_pack');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('already been claimed');

        $quests->claim($user, 'open_pack');
    }

    public function test_status_lists_every_defined_quest(): void
    {
        $user = User::factory()->create();

        $status = app(QuestService::class)->statusFor($user);

        $this->assertCount(3, $status);
        $this->assertSame('play_match', $status[0]['key']);
        $this->assertSame(1, $status[0]['target']);
        $this->assertFalse($status[0]['complete']);
        $this->assertFalse($status[0]['claimed']);
    }
}
