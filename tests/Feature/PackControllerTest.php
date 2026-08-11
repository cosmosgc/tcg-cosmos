<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PackControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('packs.index'))
            ->assertRedirect(route('login'));

        $this->post(route('packs.open'))
            ->assertRedirect(route('login'));
    }

    public function test_booster_page_lists_available_pack_and_wallet(): void
    {
        $user = User::factory()->create(['gems' => 100]);
        $this->actingAs($user);

        $response = $this->get(route('packs.index'));
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertSame(100, $props['wallet']['gems']);
        $this->assertSame('celestial-genesis', $props['pack']['id']);
        $this->assertSame(100, $props['pack']['cost']);
        $this->assertSame(5, $props['pack']['size']);
    }

    public function test_opening_a_pack_deducts_gems_and_grants_five_cards(): void
    {
        $user = User::factory()->create(['gems' => 100]);
        $this->actingAs($user);

        $response = $this->post(route('packs.open'));
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertCount(5, $props['lastOpening']['cards']);
        $this->assertSame(0, $props['wallet']['gems']);
        $this->assertDatabaseCount('pack_openings', 1);
        $this->assertDatabaseHas('user_cards', ['user_id' => $user->id]);
    }

    public function test_opening_a_pack_without_enough_gems_is_rejected(): void
    {
        $user = User::factory()->create(['gems' => 5]);
        $this->actingAs($user);

        $response = $this->post(route('packs.open'));
        $response->assertSessionHasErrors('pack');
        $this->assertDatabaseCount('pack_openings', 0);
        $this->assertDatabaseCount('user_cards', 0);
    }
}
