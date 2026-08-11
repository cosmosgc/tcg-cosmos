<?php

use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PackController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('match', [MatchController::class, 'index'])->name('match');

    Route::get('collection', [CollectionController::class, 'index'])->name('collection.index');

    Route::get('packs', [PackController::class, 'index'])->name('packs.index');
    Route::post('packs/open', [PackController::class, 'open'])->name('packs.open');

    Route::get('decks', [DeckController::class, 'index'])->name('decks.index');
    Route::get('decks/create', [DeckController::class, 'edit'])->name('decks.create');
    Route::get('decks/{deck}/edit', [DeckController::class, 'edit'])->name('decks.edit');
    Route::post('decks', [DeckController::class, 'store'])->name('decks.store');
    Route::put('decks/{deck}', [DeckController::class, 'update'])->name('decks.update');
    Route::delete('decks/{deck}', [DeckController::class, 'destroy'])->name('decks.destroy');
});

require __DIR__.'/settings.php';
