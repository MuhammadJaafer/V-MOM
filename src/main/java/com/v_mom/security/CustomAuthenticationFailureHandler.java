package com.v_mom.security;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import jakarta.servlet.ServletException;
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
    ) throws IOException, ServletException {
        if (exception.getCause() instanceof CustomEmailNotFoundException) {
            request.getSession().setAttribute("invalidEmail", true);
        } else if (exception instanceof BadCredentialsException) {
            request.getSession().setAttribute("invalidPassword", true);
        }

        setDefaultFailureUrl("/login");
        super.onAuthenticationFailure(request, response, exception);
    }
}