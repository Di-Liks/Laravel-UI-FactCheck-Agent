<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\View\View;

class FactCheckController extends Controller
{
    public function index(): View
    {
        return view('chat');
    }

    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fact' => ['required', 'string', 'min:1', 'max:10000'],
            'category' => ['required', 'string', 'in:MEDIA,SPORT,POLITICS'],
        ]);

        $url = config('factcheck.api_url').'/check';

        try {
            $response = Http::timeout(300)
                ->acceptJson()
                ->post($url, [
                    'fact' => $validated['fact'],
                    'category' => $validated['category'],
                ]);
        } catch (ConnectionException) {
            return response()->json([
                'message' => 'Не удалось подключиться к сервису проверки фактов.',
            ], 503);
        }

        if ($response->failed()) {
            return response()->json(
                $response->json() ?? ['message' => 'Ошибка при проверке факта.'],
                $response->status()
            );
        }

        return response()->json($response->json());
    }
}
