<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserQuest;
use App\Services\QuestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->post(route('quests.claim', 'play_match'))
            ->assertRedirect(route('login'));
    }

    public function test_a_completed_quest_can_be_claimed_from_the_endpoint(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        app(QuestService::class)->track($user, 'save_deck');

        $this->post(route('quests.claim', 'save_deck'))
            ->assertRedirect();

        $this->assertSame(150, $user->fresh()->dust);
        $this->assertNotNull(
            UserQuest::where('key', 'save_deck')->firstOrFail()->claimed_at,
        );
    }

    public function test_claiming_an_incomplete_quest_returns_an_error(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post(route('quests.claim', 'play_match'))
            ->assertSessionHasErrors('quest');

        $this->assertSame(0, $user->fresh()->dust);
    }
}
