package com.v_mom.controller;

import com.v_mom.entity.User;
import com.v_mom.repository.UserRepository;
import com.v_mom.service.CustomUserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller

public class signupController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public signupController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/signup")
    public String signup() {
        return "signup";
    }

    @PostMapping("/signup")
    public String processSignup(
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("password") String password
    ) {
        if (userRepository.findByEmail(email).isPresent()) {
            return "redirect:/signup?error";
        }

        User newUser = new User();
        newUser.setUsersName(name);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(password));
        userRepository.save(newUser);

        return "redirect:/login?success";
    }
}
