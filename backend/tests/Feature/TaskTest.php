<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_tasks(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }

    public function test_user_only_sees_own_tasks(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        Task::factory()->count(2)->for($user)->create();
        Task::factory()->count(3)->for($otherUser)->create();

        $response = $this->actingAs($user)->getJson('/api/tasks');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_user_can_create_task(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/tasks', [
            'title' => 'Write audit report',
            'description' => 'Summarize findings',
        ]);

        $response->assertCreated();
        $response->assertJsonFragment(['title' => 'Write audit report']);
        $this->assertDatabaseHas('tasks', [
            'title' => 'Write audit report',
            'user_id' => $user->id,
        ]);
    }

    public function test_task_creation_requires_a_title(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/tasks', [
            'description' => 'Missing title',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors('title');
    }

    public function test_user_can_view_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $response = $this->actingAs($user)->getJson("/api/tasks/{$task->id}");

        $response->assertOk();
        $response->assertJsonFragment(['id' => $task->id]);
    }

    public function test_user_cannot_view_another_users_task(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = Task::factory()->for($owner)->create();

        $response = $this->actingAs($intruder)->getJson("/api/tasks/{$task->id}");

        $response->assertNotFound();
    }

    public function test_user_can_update_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['is_done' => false]);

        $response = $this->actingAs($user)->putJson("/api/tasks/{$task->id}", [
            'title' => $task->title,
            'is_done' => true,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'is_done' => true]);
    }

    public function test_user_cannot_update_another_users_task(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = Task::factory()->for($owner)->create();

        $response = $this->actingAs($intruder)->putJson("/api/tasks/{$task->id}", [
            'title' => 'Hijacked',
        ]);

        $response->assertNotFound();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id, 'title' => 'Hijacked']);
    }

    public function test_user_can_delete_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $response = $this->actingAs($user)->deleteJson("/api/tasks/{$task->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }

    public function test_user_cannot_delete_another_users_task(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = Task::factory()->for($owner)->create();

        $response = $this->actingAs($intruder)->deleteJson("/api/tasks/{$task->id}");

        $response->assertNotFound();
        $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    }
}
