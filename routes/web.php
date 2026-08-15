<?php

use App\Http\Controllers\Admin\BoosterPackController;
use App\Http\Controllers\Admin\CardController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\PackController;
use App\Http\Controllers\QuestController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('match', [MatchController::class, 'index'])->name('match');
    Route::post('match/complete', [MatchController::class, 'complete'])->name('match.complete');

    Route::post('quests/{quest}/claim', [QuestController::class, 'claim'])->name('quests.claim');

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

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('cards', [CardController::class, 'index'])->name('cards.index');
    Route::get('cards/create', [CardController::class, 'create'])->name('cards.create');
    Route::get('cards/{card}/edit', [CardController::class, 'edit'])->name('cards.edit');
    Route::post('cards', [CardController::class, 'store'])->name('cards.store');
    Route::put('cards/{card}', [CardController::class, 'update'])->name('cards.update');
    Route::delete('cards/{card}', [CardController::class, 'destroy'])->name('cards.destroy');

    Route::get('boosters', [BoosterPackController::class, 'index'])->name('boosters.index');
    Route::get('boosters/create', [BoosterPackController::class, 'create'])->name('boosters.create');
    Route::get('boosters/{pack}/edit', [BoosterPackController::class, 'edit'])->name('boosters.edit');
    Route::post('boosters', [BoosterPackController::class, 'store'])->name('boosters.store');
    Route::put('boosters/{pack}', [BoosterPackController::class, 'update'])->name('boosters.update');
    Route::delete('boosters/{pack}', [BoosterPackController::class, 'destroy'])->name('boosters.destroy');
});

require __DIR__.'/settings.php';
