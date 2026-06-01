<?php

use App\Http\Controllers\FactCheckController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FactCheckController::class, 'index']);
Route::post('/check', [FactCheckController::class, 'check']);
