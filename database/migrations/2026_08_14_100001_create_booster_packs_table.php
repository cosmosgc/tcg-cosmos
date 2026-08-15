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
        Schema::create('booster_packs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('set_id')->nullable()->constrained('card_sets')->nullOnDelete();
            $table->string('name');
            $table->unsignedInteger('cost')->default(100);
            $table->unsignedTinyInteger('size')->default(5);
            $table->json('drop_rates')->default('[]');
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booster_packs');
    }
};
