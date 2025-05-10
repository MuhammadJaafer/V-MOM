package com.v_mom.security;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CustomAuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException {
        String errorParam = "error";

        Throwable rootCause = exception.getCause();
        if (rootCause instanceof CustomEmailNotFoundException) {
            errorParam = "invalidEmail";
        } else if (exception instanceof BadCredentialsException) {
            errorParam = "invalidPassword";
        }

        getRedirectStrategy().sendRedirect(request, response, "/login?" + errorParam);
    }
}