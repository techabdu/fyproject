<?php

namespace App\Enums;

enum Role: string
{
    case Student = 'student';
    case Supervisor = 'supervisor';
    case DeptAdmin = 'dept_admin';
    case SuperAdmin = 'super_admin';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Student',
            self::Supervisor => 'Supervisor',
            self::DeptAdmin => 'Department Admin',
            self::SuperAdmin => 'Super Admin (Faculty)',
        };
    }

    /** Roles that can moderate project uploads. */
    public function isAdmin(): bool
    {
        return in_array($this, [self::DeptAdmin, self::SuperAdmin], true);
    }

    /** @return string[] */
    public static function values(): array
    {
        return array_map(fn (self $r) => $r->value, self::cases());
    }
}
