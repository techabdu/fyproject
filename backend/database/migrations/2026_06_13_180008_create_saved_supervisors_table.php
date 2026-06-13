<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_supervisors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // A student bookmarks a given supervisor at most once.
            $table->unique(['student_id', 'supervisor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_supervisors');
    }
};
