package com.csit321g1.ana.aura.exception;

import org.springframework.http.HttpStatus;

/** Base class for errors that map straight to an HTTP status and a {"error": "..."} body. */
public abstract class ApiException extends RuntimeException {

    private final HttpStatus status;

    protected ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
