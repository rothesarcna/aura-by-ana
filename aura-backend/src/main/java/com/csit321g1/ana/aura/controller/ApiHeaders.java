package com.csit321g1.ana.aura.controller;

public final class ApiHeaders {

    /**
     * Identifies the signed-in user (the "id" returned by /api/auth/login).
     * NOTE: this is not real authentication; see docs/API.md.
     */
    public static final String USER_ID = "X-User-Id";

    private ApiHeaders() {
    }
}
