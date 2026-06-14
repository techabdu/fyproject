<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

/**
 * A single in-app (database-channel) notification. A `type` string lets the
 * frontend pick an icon/treatment, `message` is the human-readable text, and
 * `payload` carries any ids needed to link to the related resource.
 *
 * Deliberately NOT queued — it persists synchronously, so no worker is needed.
 */
class SystemNotification extends Notification
{
    /** @param array<string, mixed> $payload */
    public function __construct(
        public string $type,
        public string $message,
        public array $payload = [],
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'message' => $this->message,
            'payload' => $this->payload,
        ];
    }
}
