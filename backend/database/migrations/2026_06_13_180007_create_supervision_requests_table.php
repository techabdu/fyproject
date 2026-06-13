<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervision_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->string('proposed_title');
            $table->text('proposal_summary');
            // Keywords used for the match score (normalised, comma-separated).
            $table->text('proposal_keywords')->nullable();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending')->index();
            // Required when declined; optional when accepted.
            $table->text('decision_reason')->nullable();
            $table->timestamps();
        });

        // DB-level integrity backstop for the "one active request per student"
        // rule. A STORED generated column equals the student_id while the row is
        // active (pending|accepted) and NULL otherwise. A UNIQUE index over it
        // permits many NULLs but only one active row per student — race-safe even
        // under concurrent submissions. Application code also enforces this in a
        // transaction (see SupervisionRequestController), but this is the backstop.
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE supervision_requests
                 ADD COLUMN active_lock BIGINT UNSIGNED
                 GENERATED ALWAYS AS (
                     CASE WHEN status IN ('pending','accepted') THEN student_id ELSE NULL END
                 ) STORED"
            );
            DB::statement(
                'ALTER TABLE supervision_requests
                 ADD UNIQUE INDEX uniq_active_request_per_student (active_lock)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supervision_requests');
    }
};
