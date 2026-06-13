<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_keywords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            // Normalised keyword; used for filtering + duplicate/overlap indicator.
            $table->string('keyword')->index();

            $table->unique(['project_id', 'keyword']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_keywords');
    }
};
