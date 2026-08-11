<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $pack_id
 * @property string $reward_table_version
 * @property array<int, array<string, mixed>> $cards
 * @property int $dust_gained
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'pack_id', 'reward_table_version', 'cards', 'dust_gained'])]
class PackOpening extends Model
{
    /**
     * The user who opened this pack.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'cards' => 'array',
            'dust_gained' => 'int',
        ];
    }
}
