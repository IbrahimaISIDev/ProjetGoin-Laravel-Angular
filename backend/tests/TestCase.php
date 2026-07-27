<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Sanctum n'active la session/CSRF que pour les requêtes reconnues
        // comme venant du frontend (Referer/Origin dans SANCTUM_STATEFUL_DOMAINS).
        // On simule ici l'appel réel du SPA Angular.
        $this->withHeader('Referer', env('FRONTEND_URL', 'http://localhost:4200'));
    }
}
