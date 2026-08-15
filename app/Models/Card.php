<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $code
 * @property int|null $set_id
 * @property int|null $faction_id
 * @property string $name
 * @property string $type
 * @property int $cost
 * @property string $rarity
 * @property int|null $power
 * @property int|null $health
 * @property array<int, string> $keywords
 * @property string|null $text
 * @property array<int, array{trigger: string, actions: array<int, array<string, mixed>>}> $effects
 * @property string $finish
 * @property string|null $frame_variant
 * @property string|null $art_url
 * @property int $sort
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'code',
    'set_id',
    'faction_id',
    'name',
    'type',
    'cost',
    'rarity',
    'power',
    'health',
    'keywords',
    'text',
    'effects',
    'finish',
    'frame_variant',
    'art_url',
    'sort',
])]
class Card extends Model
{
    /**
     * The set this card belongs to.
     *
     * @return BelongsTo<CardSet, $this>
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(CardSet::class);
    }

    /**
     * The faction this card belongs to, if any.
     *
     * @return BelongsTo<Faction, $this>
     */
    public function faction(): BelongsTo
    {
        return $this->belongsTo(Faction::class);
    }

    /**
     * Inventory entries granting this card to users.
     *
     * @return HasMany<UserCard, $this>
     */
    public function userCards(): HasMany
    {
        return $this->hasMany(UserCard::class);
    }

    /**
     * Public URL for this card's uploaded art, if any.
     */
    public function artUrl(): ?string
    {
        if (! $this->art_url) {
            return null;
        }

        return Storage::disk('public')->url($this->art_url);
    }

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'effects' => 'array',
        ];
    }
}
