<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\StarterCollection;
use Illuminate\Database\Seeder;

class StarterCollectionSeeder extends Seeder
{
    /**
     * Grant every existing user that lacks a collection a starter collection
     * and booster currency. Run after GameDataSeeder so the card catalogue
     * exists.
     */
    public function run(): void
    {
        foreach (User::all() as $user) {
            app(StarterCollection::class)->grant($user);
        }
    }
}
