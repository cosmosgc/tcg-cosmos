<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\QuestService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_admin_flag_is_exposed_to_the_frontend()
    {
        $user = User::factory()->admin()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertTrue($props['auth']['user']['is_admin']);

        $this->assertSame($user->id, $props['auth']['user']['id']);
    }

    public function test_dashboard_includes_quest_board_and_wallet()
    {
        $user = User::factory()->create(['gems' => 500, 'dust' => 25]);
        $this->actingAs($user);
        app(QuestService::class)->track($user, 'play_match');

        $response = $this->get(route('dashboard'));
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertCount(3, $props['quests']);
        $this->assertTrue($props['quests'][0]['complete']);

        $this->assertSame(500, $props['wallet']['gems']);
        $this->assertSame(25, $props['wallet']['dust']);
    }
}
