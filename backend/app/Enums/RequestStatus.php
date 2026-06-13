<?php

namespace App\Enums;

enum RequestStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Declined = 'declined';

    /** Statuses that count as an "active" supervision request for a student. */
    public const ACTIVE = ['pending', 'accepted'];
}
