<?php

namespace App\Models;

use App\Enums\RequestStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupervisionRequest extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'student_id',
        'supervisor_id',
        'proposed_title',
        'proposal_summary',
        'proposal_keywords',
        'status',
        'decision_reason',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'status' => RequestStatus::class,
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function isActive(): bool
    {
        return in_array($this->status->value, RequestStatus::ACTIVE, true);
    }
}
