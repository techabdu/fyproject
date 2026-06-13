<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('faculty');
            $table->timestamps();

            $table->unique(['name', 'faculty']);
        });

        // Now that departments exists, attach the FK from users.department_id.
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('department_id')
                ->references('id')->on('departments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
        });

        Schema::dropIfExists('departments');
    }
};
