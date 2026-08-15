<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    public function test_served_card_effects_use_the_engine_shape(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('match'));
        $response->assertOk();

        $cards = $response->viewData('page')['props']['cards'];
        $beacon = collect($cards)->firstWhere('id', 'daw-beacon');

        $this->assertIsArray($beacon['effects']);
        $this->assertSame('on_play', $beacon['effects'][0]['trigger']);
        $this->assertSame(
            [
                'kind' => 'target_unit',
                'scope' => 'enemy_unit',
            ],
            $beacon['effects'][0]['actions'][0]['target'],
        );
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $response = $this->get(route('match'));
        $response->assertRedirect(route('login'));

        $this->post(route('match.complete'))->assertRedirect(route('login'));
    }

    public function test_completing_a_match_tracks_the_first_battle_quest(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post(route('match.complete'))->assertRedirect();

        $this->assertDatabaseHas('user_quests', [
            'user_id' => $user->id,
            'key' => 'play_match',
            'progress' => 1,
        ]);
    }
}
