<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pack_openings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('pack_id');
            $table->string('reward_table_version');
            $table->json('cards')->default('[]'); // list of {code, finish} granted
            $table->unsignedInteger('dust_gained')->default(0);
            $table->timestamps();

            $table->index('user_id');
            $table->index(['pack_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pack_openings');
    }
};
