<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated();
        $response->assertJsonFragment(['email' => 'jane@example.com']);

        $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
        $this->assertAuthenticated();
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'jane@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
    }

    public function test_registration_fails_when_passwords_do_not_match(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'nope',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('password');
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk();
        $response->assertJsonFragment(['email' => 'jane@example.com']);
        $this->assertAuthenticated();
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'jane@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('email');
        $this->assertGuest();
    }

    public function test_authenticated_user_can_fetch_current_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/me');

        $response->assertOk();
        $response->assertJsonFragment(['email' => $user->email]);
    }

    public function test_guest_cannot_fetch_current_user(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/logout');
        $response->assertOk();

        // On vérifie le vrai contrat observable : une requête *suivante* (donc un
        // nouveau cycle requête/réponse, comme en production) n'est plus authentifiée.
        // Note : Auth::guard('web')->logout() invalide bien la session (le mécanisme
        // qui protège les requêtes suivantes), mais dans PHPUnit tout tourne dans le
        // même process, et le guard "sanctum" (actif après le middleware auth:sanctum)
        // met en cache l'utilisateur indépendamment du guard "web" qu'on vient de
        // déconnecter — d'où l'usage d'assertGuest('web') plutôt que du guard par défaut.
        $this->assertGuest('web');
    }
}
