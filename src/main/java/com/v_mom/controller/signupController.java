package com.v_mom.controller;

import com.v_mom.entity.User;
import com.v_mom.repository.UserRepository;
import com.v_mom.service.CustomUserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;


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
            @RequestParam("password") String password,
            RedirectAttributes redirectAttributes
    ) {
        String normalizedEmail = email.toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            redirectAttributes.addFlashAttribute("emailExists", true);
            return "redirect:/signup";
        }

        User newUser = new User();
        newUser.setUsersName(name);
        newUser.setEmail(normalizedEmail);
        newUser.setPassword(passwordEncoder.encode(password));
        userRepository.save(newUser);

        redirectAttributes.addFlashAttribute("success", true);
        return "redirect:/login";
    }
}
