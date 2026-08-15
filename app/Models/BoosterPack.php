<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property int|null $set_id
 * @property string $name
 * @property int $cost
 * @property int $size
 * @property array<string, array<string, int>> $drop_rates
 * @property bool $enabled
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['code', 'set_id', 'name', 'cost', 'size', 'drop_rates', 'enabled'])]
class BoosterPack extends Model
{
    /**
     * The set this booster belongs to, if any.
     *
     * @return BelongsTo<CardSet, $this>
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(CardSet::class);
    }

    protected function casts(): array
    {
        return [
            'drop_rates' => 'array',
            'cost' => 'int',
            'size' => 'int',
            'enabled' => 'bool',
        ];
    }
}
