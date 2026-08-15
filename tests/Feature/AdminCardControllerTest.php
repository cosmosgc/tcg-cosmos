<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\User;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminCardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('admin.cards.index'))->assertRedirect(route('login'));
        $this->post(route('admin.cards.store'))->assertRedirect(route('login'));
        $this->get(route('admin.cards.create'))->assertRedirect(route('login'));
    }

    public function test_non_admin_users_are_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('admin.cards.index'))
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('admin.cards.store'), ['name' => 'x'])
            ->assertForbidden();
    }

    public function test_admins_can_list_cards(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $response = $this->get(route('admin.cards.index'));
        $response->assertOk();

        $cards = $response->viewData('page')['props']['cards'];
        $this->assertGreaterThan(50, count($cards));
        $this->assertArrayHasKey('code', $cards[0]);
        $this->assertArrayHasKey('hasArt', $cards[0]);
    }

    public function test_admins_can_create_a_card(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $response = $this->post(route('admin.cards.store'), [
            'code' => 'test-hero',
            'name' => 'Test Hero',
            'type' => 'unit',
            'cost' => 3,
            'rarity' => 'rare',
            'power' => 4,
            'health' => 5,
            'keywords' => ['swift'],
            'text' => 'A unit for tests.',
            'effects' => '[{"trigger":"on_play","actions":[]}]',
            'finish' => 'foil',
            'frame_variant' => 'neutral-rare',
            'sort' => 0,
        ]);

        $response->assertRedirect(route('admin.cards.index'));
        $this->assertDatabaseHas('cards', ['code' => 'test-hero', 'power' => 4]);
    }

    public function test_admins_can_update_a_card(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $card = Card::where('code', 'daw-sentinel')->first();

        $this->put(route('admin.cards.update', $card), [
            'code' => 'daw-sentinel',
            'name' => 'Renamed Sentinel',
            'type' => 'unit',
            'cost' => 2,
            'rarity' => 'uncommon',
            'power' => 2,
            'health' => 4,
            'keywords' => [],
            'text' => null,
            'effects' => '[]',
            'finish' => 'standard',
            'frame_variant' => null,
            'sort' => 0,
        ])->assertRedirect(route('admin.cards.index'));

        $card->refresh();
        $this->assertSame('Renamed Sentinel', $card->name);
        $this->assertSame(2, $card->cost);
    }

    public function test_admins_can_upload_and_replace_card_art(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $card = Card::where('code', 'daw-sentinel')->first();

        $this->put(route('admin.cards.update', $card), [
            'code' => 'daw-sentinel',
            'name' => $card->name,
            'type' => 'unit',
            'cost' => $card->cost,
            'rarity' => $card->rarity,
            'power' => $card->power,
            'health' => $card->health,
            'keywords' => $card->keywords,
            'text' => $card->text,
            'effects' => '[]',
            'finish' => $card->finish,
            'frame_variant' => $card->frame_variant,
            'sort' => 0,
            'art' => UploadedFile::fake()->image('art.png', 120, 120),
        ])->assertRedirect(route('admin.cards.index'));

        $card->refresh();
        $this->assertNotNull($card->art_url);
        Storage::disk('public')->assertExists($card->art_url);
        Storage::disk('public')->assertExists('card-art/daw-sentinel.png');

        $this->put(route('admin.cards.update', $card), [
            'code' => 'daw-sentinel',
            'name' => $card->name,
            'type' => 'unit',
            'cost' => $card->cost,
            'rarity' => $card->rarity,
            'power' => $card->power,
            'health' => $card->health,
            'keywords' => $card->keywords,
            'text' => $card->text,
            'effects' => '[]',
            'finish' => $card->finish,
            'frame_variant' => $card->frame_variant,
            'sort' => 0,
            'art' => UploadedFile::fake()->image('new.png', 120, 120),
        ])->assertRedirect(route('admin.cards.index'));

        $card->refresh();
        $this->assertSame('card-art/daw-sentinel.png', $card->art_url);
    }

    public function test_admins_can_remove_and_delete_card_art(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $card = Card::where('code', 'daw-sentinel')->first();
        $card->update(['art_url' => 'card-art/daw-sentinel.png']);
        Storage::disk('public')->put('card-art/daw-sentinel.png', 'bytes');

        $this->delete(route('admin.cards.destroy', $card))
            ->assertRedirect(route('admin.cards.index'));

        Storage::disk('public')->assertMissing('card-art/daw-sentinel.png');
        $this->assertDatabaseMissing('cards', ['code' => 'daw-sentinel']);
    }

    public function test_art_can_be_cleared_without_deleting_the_card(): void
    {
        Storage::fake('public');

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);

        $card = Card::where('code', 'daw-sentinel')->first();
        $card->update(['art_url' => 'card-art/daw-sentinel.png']);
        Storage::disk('public')->put('card-art/daw-sentinel.png', 'bytes');

        $this->put(route('admin.cards.update', $card), [
            'code' => 'daw-sentinel',
            'name' => $card->name,
            'type' => 'unit',
            'cost' => $card->cost,
            'rarity' => $card->rarity,
            'power' => $card->power,
            'health' => $card->health,
            'keywords' => $card->keywords,
            'text' => $card->text,
            'effects' => '[]',
            'finish' => $card->finish,
            'frame_variant' => $card->frame_variant,
            'sort' => 0,
            'remove_art' => true,
        ])->assertRedirect(route('admin.cards.index'));

        $card->refresh();
        $this->assertNull($card->art_url);
        Storage::disk('public')->assertMissing('card-art/daw-sentinel.png');
    }
}
