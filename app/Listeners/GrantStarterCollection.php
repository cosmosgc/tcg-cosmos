<?php

namespace App\Listeners;

use App\Models\User;
use App\Services\StarterCollection;
use Illuminate\Auth\Events\Registered;

class GrantStarterCollection
{
    public function __construct(
        private readonly StarterCollection $starter,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        if ($event->user instanceof User) {
            $this->starter->grant($event->user);
        }
    }
}
