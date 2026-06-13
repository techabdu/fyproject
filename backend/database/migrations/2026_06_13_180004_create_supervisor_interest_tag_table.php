<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervisor_interest_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_profile_id')->constrained('supervisor_profiles')->cascadeOnDelete();
            $table->foreignId('interest_tag_id')->constrained('interest_tags')->cascadeOnDelete();

            $table->unique(['supervisor_profile_id', 'interest_tag_id'], 'supervisor_tag_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_interest_tag');
    }
};
