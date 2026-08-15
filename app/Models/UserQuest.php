<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $key
 * @property int $progress
 * @property int $target
 * @property Carbon|null $claimed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'key', 'progress', 'target', 'claimed_at'])]
class UserQuest extends Model
{
    /**
     * The user who is tracking this quest.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Whether the quest progress has reached its target.
     */
    public function isComplete(): bool
    {
        return $this->progress >= $this->target;
    }

    /**
     * Whether this quest has been claimed and its reward granted.
     */
    public function isClaimed(): bool
    {
        return $this->claimed_at !== null;
    }

    protected function casts(): array
    {
        return [
            'progress' => 'int',
            'target' => 'int',
            'claimed_at' => 'datetime',
        ];
    }
}
