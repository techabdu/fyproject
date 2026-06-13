<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'title',
        'abstract',
        'department_id',
        'graduation_year',
        'uploaded_by',
        'pdf_path',
        'status',
        'rejection_feedback',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'status' => ProjectStatus::class,
        'graduation_year' => 'integer',
    ];

    /** Never expose the on-disk PDF path to clients. */
    protected $hidden = ['pdf_path'];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function keywords(): HasMany
    {
        return $this->hasMany(ProjectKeyword::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ProjectStatus::Approved);
    }
}
