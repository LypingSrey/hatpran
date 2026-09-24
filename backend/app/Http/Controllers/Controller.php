<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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
}
