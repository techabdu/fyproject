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

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (in_array($model->status, ['pending', 'accepted'])) {
                $exists = self::where('student_id', $model->student_id)
                    ->whereIn('status', ['pending', 'accepted'])
                    ->exists();
                
                if ($exists) {
                    throw new \Exception('Student already has an active request');
                }
            }
        }
                         }

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
