<?php

namespace Tests\Feature;

use App\Models\Card;
use App\Models\Deck;
use App\Models\User;
use App\Services\InventoryService;
use Database\Seeders\GameDataSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeckControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(GameDataSeeder::class);
    }

    /**
     * Grant the user 3 copies of every non-leader dawnspire card so any legal
     * dawnspire list can be submitted.
     */
    private function grantDawnspire(User $user): void
    {
        $codes = Card::where('faction_id', 1)
            ->where('type', '!=', 'leader')
            ->pluck('code')
            ->all();

        app(InventoryService::class)->grantCards($user, array_merge(
            ...array_map(fn (string $code): array => [
                ['code' => $code],
                ['code' => $code],
                ['code' => $code],
            ], $codes),
        ));
    }

    /**
     * A legal dawnspire deck: leader + 29 faction cards (10 unique, all within
     * the 3-copy limit).
     *
     * @return array{name: string, leaderCardCode: string, cards: array<int, string>}
     */
    private function legalDeckPayload(): array
    {
        $codes = [
            'daw-sentinel',
            'daw-disciple',
            'daw-talon',
            'daw-wardbringer',
            'daw-cohort',
            'daw-lancer',
            'daw-phalanx',
            'daw-paragon',
            'daw-general',
            'daw-beacon',
        ];

        return [
            'name' => 'Test Dawn',
            'leaderCardCode' => 'leader-dawnspire',
            'cards' => array_merge(
                $codes,
                $codes,
                array_slice($codes, 0, 9),
            ),
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('decks.index'))
            ->assertRedirect(route('login'));

        $this->get(route('decks.create'))
            ->assertRedirect(route('login'));

        $this->post(route('decks.store'))
            ->assertRedirect(route('login'));
    }

    public function test_deck_list_shows_saved_decks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Deck::create([
            'user_id' => $user->id,
            'name' => 'First Deck',
            'leader_card_code' => 'leader-dawnspire',
            'cards' => [],
        ]);

        $response = $this->get(route('decks.index'));
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertCount(1, $props['decks']);
        $this->assertSame('First Deck', $props['decks'][0]['name']);
    }

    public function test_a_legal_deck_can_be_created(): void
    {
        $user = User::factory()->create();
        $this->grantDawnspire($user);
        $this->actingAs($user);

        $payload = $this->legalDeckPayload();

        $this->withoutExceptionHandling();
        $response = $this->post(route('decks.store'), $payload);
        $response->assertRedirect(route('decks.index'));

        $this->assertDatabaseHas('decks', [
            'user_id' => $user->id,
            'name' => 'Test Dawn',
            'leader_card_code' => 'leader-dawnspire',
        ]);
    }

    public function test_an_illegal_deck_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->grantDawnspire($user);
        $this->actingAs($user);

        $payload = $this->legalDeckPayload();
        $payload['cards'] = array_slice($payload['cards'], 0, 10);

        $response = $this->post(route('decks.store'), $payload);
        $response->assertSessionHasErrors('deck');
        $this->assertDatabaseCount('decks', 0);
    }

    public function test_a_deck_requiring_cards_the_user_does_not_own_is_rejected(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('decks.store'), $this->legalDeckPayload());
        $response->assertSessionHasErrors('deck');
        $this->assertDatabaseCount('decks', 0);
    }

    public function test_a_user_cannot_edit_or_delete_another_users_deck(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $deck = Deck::create([
            'user_id' => $owner->id,
            'name' => 'Private',
            'leader_card_code' => 'leader-dawnspire',
            'cards' => [],
        ]);

        $this->actingAs($intruder);

        $this->get(route('decks.edit', $deck))->assertForbidden();
        $this->put(route('decks.update', $deck), $this->legalDeckPayload())->assertForbidden();
        $this->delete(route('decks.destroy', $deck))->assertForbidden();

        $this->assertDatabaseHas('decks', ['id' => $deck->id]);
    }
}
