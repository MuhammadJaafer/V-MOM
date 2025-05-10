package com.v_mom.security;

import org.springframework.security.core.AuthenticationException;

public class CustomEmailNotFoundException extends AuthenticationException {
    public CustomEmailNotFoundException(String msg) {
        super(msg);
    }
}