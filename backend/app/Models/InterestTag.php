<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class InterestTag extends Model
{
    /** @var list<string> */
    protected $fillable = ['name'];

    public function supervisorProfiles(): BelongsToMany
    {
        return $this->belongsToMany(SupervisorProfile::class, 'supervisor_interest_tag');
    }

    /** Normalise a tag name: lowercase + trimmed + collapsed whitespace. */
    public static function normalise(string $name): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $name)));
    }
}
