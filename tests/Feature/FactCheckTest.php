<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FactCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_check_proxies_fact_to_agent_and_returns_response(): void
    {
        config(['factcheck.api_url' => 'http://agent-system:8080']);

        Http::fake([
            'http://agent-system:8080/check' => Http::response([
                'originalClaim' => 'Земля плоская',
                'decomposerResponses' => [],
                'verificatorResponses' => [],
                'summatorResponse' => 'Утверждение ложно.',
            ]),
        ]);

        $response = $this->postJson('/check', [
            'fact' => 'Земля плоская',
            'category' => 'SPORT',
        ]);

        $response->assertOk()
            ->assertJsonPath('originalClaim', 'Земля плоская')
            ->assertJsonPath('summatorResponse', 'Утверждение ложно.');

        Http::assertSent(function ($request) {
            return $request->url() === 'http://agent-system:8080/check'
                && $request['fact'] === 'Земля плоская'
                && $request['category'] === 'SPORT';
        });
    }

    public function test_check_validates_fact(): void
    {
        $response = $this->postJson('/check', [
            'fact' => '',
            'category' => 'SPORT',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('fact');
    }

    public function test_check_validates_category(): void
    {
        $response = $this->postJson('/check', [
            'fact' => 'Земля плоская',
            'category' => 'SCIENCE',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('category');
    }
}
