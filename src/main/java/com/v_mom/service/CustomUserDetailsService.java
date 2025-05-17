package com.v_mom.service;

import com.v_mom.entity.User;
import com.v_mom.repository.UserRepository;
import com.v_mom.security.CustomEmailNotFoundException;
import com.v_mom.security.CustomUserDetails;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        String normalizedEmail = email.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new CustomEmailNotFoundException("User with email " + email + " not found"));

        return new CustomUserDetails(user);
    }
}