package com.v_mom.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;
import jakarta.servlet.http.HttpSession;


@Controller
public class LoginController {

    @GetMapping("/login")
    public String showLoginForm(HttpSession session, Model model) {
        if (session.getAttribute("invalidEmail") != null) {
            model.addAttribute("invalidEmail", session.getAttribute("invalidEmail"));
            session.removeAttribute("invalidEmail");
        }

        if (session.getAttribute("invalidPassword") != null) {
            model.addAttribute("invalidPassword", session.getAttribute("invalidPassword"));
            session.removeAttribute("invalidPassword");
        }

        return "login";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordPage() {
        return "forgot-password";
    }
}