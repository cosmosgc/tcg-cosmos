<?php

namespace Tests\Feature;

use App\Models\BoosterPack;
use App\Models\User;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBoosterPackControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('admin.boosters.index'))->assertRedirect(route('login'));
        $this->post(route('admin.boosters.store'))->assertRedirect(route('login'));
        $this->get(route('admin.boosters.create'))->assertRedirect(route('login'));
    }

    public function test_non_admin_users_are_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('admin.boosters.index'))
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('admin.boosters.store'), ['name' => 'x'])
            ->assertForbidden();
    }

    public function test_admins_can_list_boosters(): void
    {
        $admin = User::factory()->admin()->create();
        BoosterPack::create([
            'code' => 'test-pack',
            'name' => 'Test Pack',
            'cost' => 50,
            'size' => 5,
            'drop_rates' => [
                'uncommon_or_better' => ['uncommon' => 100],
                'rare_or_better' => ['rare' => 100],
            ],
            'enabled' => true,
        ]);

        $this->actingAs($admin);

        $response = $this->get(route('admin.boosters.index'));
        $response->assertOk();

        $packs = $response->viewData('page')['props']['packs'];
        $this->assertCount(1, $packs);
        $this->assertSame('test-pack', $packs[0]['code']);
        $this->assertTrue($packs[0]['enabled']);
    }

    public function test_admins_can_create_a_booster(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $this->post(route('admin.boosters.store'), [
            'code' => 'mystic-box',
            'name' => 'Mystic Box',
            'cost' => 200,
            'size' => 7,
            'drop_rates' => json_encode([
                'uncommon_or_better' => ['uncommon' => 70, 'rare' => 30],
                'rare_or_better' => ['rare' => 80, 'epic' => 20],
            ]),
            'enabled' => true,
        ])->assertRedirect(route('admin.boosters.index'));

        $this->assertDatabaseHas('booster_packs', [
            'code' => 'mystic-box',
            'cost' => 200,
            'size' => 7,
            'enabled' => true,
        ]);
    }

    public function test_admins_can_update_a_booster(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $pack = BoosterPack::create([
            'code' => 'mystic-box',
            'name' => 'Mystic Box',
            'cost' => 200,
            'size' => 7,
            'drop_rates' => [],
            'enabled' => true,
        ]);

        $this->put(route('admin.boosters.update', $pack), [
            'code' => 'mystic-box',
            'name' => 'Mystic Box Deluxe',
            'cost' => 250,
            'size' => 5,
            'drop_rates' => json_encode([
                'uncommon_or_better' => ['uncommon' => 50, 'rare' => 50],
                'rare_or_better' => ['rare' => 100],
            ]),
            'enabled' => false,
        ])->assertRedirect(route('admin.boosters.index'));

        $pack->refresh();
        $this->assertSame('Mystic Box Deluxe', $pack->name);
        $this->assertSame(250, $pack->cost);
        $this->assertFalse($pack->enabled);
    }

    public function test_admins_can_delete_a_booster(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $pack = BoosterPack::create([
            'code' => 'mystic-box',
            'name' => 'Mystic Box',
            'cost' => 200,
            'size' => 5,
            'drop_rates' => [],
            'enabled' => true,
        ]);

        $this->delete(route('admin.boosters.destroy', $pack))
            ->assertRedirect(route('admin.boosters.index'));

        $this->assertDatabaseMissing('booster_packs', ['code' => 'mystic-box']);
    }

    public function test_enabled_booster_drives_the_player_booster_screen(): void
    {
        BoosterPack::create([
            'code' => 'mystic-box',
            'name' => 'Mystic Box',
            'cost' => 250,
            'size' => 7,
            'drop_rates' => [
                'uncommon_or_better' => ['uncommon' => 70, 'rare' => 30],
                'rare_or_better' => ['rare' => 80, 'epic' => 20],
            ],
            'enabled' => true,
        ]);

        $user = User::factory()->create(['gems' => 300]);
        $this->actingAs($user);

        $response = $this->get(route('packs.index'));
        $response->assertOk();

        $pack = $response->viewData('page')['props']['pack'];
        $this->assertSame('mystic-box', $pack['id']);
        $this->assertSame(250, $pack['cost']);
        $this->assertSame(7, $pack['size']);

        $opening = $this->post(route('packs.open'));
        $opening->assertOk();

        $lastOpening = $opening->viewData('page')['props']['lastOpening'];
        $this->assertCount(7, $lastOpening['cards']);
        $this->assertSame(50, $opening->viewData('page')['props']['wallet']['gems']);
    }
}
