<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ProjectKeyword extends Model
{
    public $timestamps = false;

    /** @var list<string> */
    protected $fillable = ['project_id', 'keyword'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public static function normalise(string $keyword): string
    {
        return Str::lower(trim(preg_replace('/\s+/', ' ', $keyword)));
    }
}
