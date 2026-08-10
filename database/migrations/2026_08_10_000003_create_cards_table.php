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
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('set_id')->nullable()->constrained('card_sets')->nullOnDelete();
            $table->foreignId('faction_id')->nullable()->constrained('factions')->nullOnDelete();
            $table->string('name');
            $table->string('type'); // unit | action | equipment | leader
            $table->unsignedTinyInteger('cost')->default(0);
            $table->string('rarity'); // common | uncommon | rare | epic | legendary
            $table->unsignedSmallInteger('power')->nullable();
            $table->unsignedSmallInteger('health')->nullable();
            $table->json('keywords')->default('[]');
            $table->text('text')->nullable();
            $table->json('effects')->default('[]');
            $table->string('finish')->default('standard'); // standard | foil | prismatic | aurora | etched
            $table->string('frame_variant')->nullable();
            $table->string('art_url')->nullable();
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();

            $table->index('faction_id');
            $table->index('set_id');
            $table->index('type');
            $table->index('rarity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
