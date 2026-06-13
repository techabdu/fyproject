<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('abstract');
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->year('graduation_year')->index();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            // Path within the (non-public) storage disk; never a public URL.
            $table->string('pdf_path');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->index();
            $table->text('rejection_feedback')->nullable();
            $table->timestamps();
        });

        // Free-text search over title + abstract (MySQL/MariaDB FULLTEXT).
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE projects ADD FULLTEXT projects_fulltext (title, abstract)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
