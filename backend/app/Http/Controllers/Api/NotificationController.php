<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /** Recent notifications for the current user + the unread count. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = $user->notifications()->latest()->limit(30)->get()
            ->map(fn (DatabaseNotification $n) => $this->shape($n));

        return response()->json([
            'data' => $items,
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All marked as read.']);
    }

    /** @return array<string, mixed> */
    private function shape(DatabaseNotification $n): array
    {
        return [
            'id' => $n->id,
            'type' => $n->data['type'] ?? 'system',
            'message' => $n->data['message'] ?? '',
            'payload' => $n->data['payload'] ?? [],
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ];
    }
}
