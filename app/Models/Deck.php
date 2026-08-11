<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $leader_card_code
 * @property array<int, string> $cards
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'leader_card_code', 'cards'])]
class Deck extends Model
{
    /**
     * The user who owns this deck.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The leader card this deck is built around.
     *
     * @return BelongsTo<Card, $this>
     */
    public function leader(): BelongsTo
    {
        return $this->belongsTo(Card::class, 'leader_card_code', 'code');
    }

    protected function casts(): array
    {
        return [
            'cards' => 'array',
        ];
    }
}
