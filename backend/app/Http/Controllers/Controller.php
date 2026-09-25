<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

abstract class Controller
{
    protected const MAX_PER_PAGE = 100;

    /**
     * Resolve the requested page size, falling back to the default when invalid.
     */
    protected function perPage(Request $request, int $default): int
    {
        $perPage = $request->integer('per_page', $default);

        return $perPage < 1 ? $default : min($perPage, self::MAX_PER_PAGE);
    }

    /**
     * Trim and lowercase the request's email before validation, because PostgreSQL compares
     * text case-sensitively and "Sam@example.com" and "sam@example.com" are the same inbox.
     */
    protected function normalizeEmail(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => Str::lower(trim($request->input('email')))]);
        }
    }
}
