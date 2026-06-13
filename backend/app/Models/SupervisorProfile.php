<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SupervisorProfile extends Model
{
    /** @var list<string> */
    protected $fillable = ['user_id', 'bio', 'max_capacity', 'current_load'];

    /** @var array<string, string> */
    protected $casts = [
        'max_capacity' => 'integer',
        'current_load' => 'integer',
    ];

    protected $appends = ['available_slots'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function interestTags(): BelongsToMany
    {
        return $this->belongsToMany(InterestTag::class, 'supervisor_interest_tag');
    }

    /** Live available capacity = max − current (never negative). */
    protected function availableSlots(): Attribute
    {
        return Attribute::make(
            get: fn () => max(0, $this->max_capacity - $this->current_load),
        );
    }

    public function hasCapacity(): bool
    {
        return $this->current_load < $this->max_capacity;
    }
}
