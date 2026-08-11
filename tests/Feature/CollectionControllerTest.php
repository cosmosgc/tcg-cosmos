<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\User;
use App\Services\InventoryService;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('collection.index'))
            ->assertRedirect(route('login'));
    }

    public function test_collection_lists_all_cards_with_owned_quantities(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $card = Card::where('code', 'daw-sentinel')->first();
        app(InventoryService::class)->grantCards($user, [
            ['code' => 'daw-sentinel'],
            ['code' => 'daw-sentinel'],
        ]);

        $response = $this->get(route('collection.index'));
        $response->assertOk();

        $page = $response->viewData('page')['props'];

        $this->assertCount(56, $page['cards']);
        $this->assertSame(2, $page['owned']['daw-sentinel']);
        $this->assertSame(0, $page['wallet']['gems']);
    }

    public function test_wallet_reflects_starting_currency(): void
    {
        $user = User::factory()->create(['gems' => 500, 'dust' => 25]);
        $this->actingAs($user);

        $response = $this->get(route('collection.index'));
        $response->assertOk();

        $wallet = $response->viewData('page')['props']['wallet'];
        $this->assertSame(500, $wallet['gems']);
        $this->assertSame(25, $wallet['dust']);
    }
}
