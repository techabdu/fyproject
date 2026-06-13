<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_profiles', function (Blueprint $table) {
            $table->id();
            // One-to-one with a supervisor user.
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->unsignedInteger('max_capacity')->default(0);
            // Derived/maintained count of accepted students.
            $table->unsignedInteger('current_load')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_profiles');
    }
};
