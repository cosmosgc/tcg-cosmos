<?php

use App\Http\Controllers\MatchController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('match', [MatchController::class, 'index'])->name('match');
});

require __DIR__.'/settings.php';
