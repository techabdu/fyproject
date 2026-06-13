<?php

namespace App\Models;

use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department_id',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    // ----- Relationships -------------------------------------------------

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function supervisorProfile(): HasOne
    {
        return $this->hasOne(SupervisorProfile::class);
    }

    public function uploadedProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'uploaded_by');
    }

    /** Requests this user submitted as a student. */
    public function sentRequests(): HasMany
    {
        return $this->hasMany(SupervisionRequest::class, 'student_id');
    }

    /** Requests this user received as a supervisor. */
    public function receivedRequests(): HasMany
    {
        return $this->hasMany(SupervisionRequest::class, 'supervisor_id');
    }

    public function savedSupervisors(): HasMany
    {
        return $this->hasMany(SavedSupervisor::class, 'student_id');
    }

    // ----- Role helpers --------------------------------------------------

    public function isStudent(): bool
    {
        return $this->role === Role::Student;
    }

    public function isSupervisor(): bool
    {
        return $this->role === Role::Supervisor;
    }

    public function isDeptAdmin(): bool
    {
        return $this->role === Role::DeptAdmin;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === Role::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this->role->isAdmin();
    }

    /** Whether this admin can act on the given department. */
    public function canActOnDepartment(?int $departmentId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->isDeptAdmin()
            && $departmentId !== null
            && $this->department_id === $departmentId;
    }
}
