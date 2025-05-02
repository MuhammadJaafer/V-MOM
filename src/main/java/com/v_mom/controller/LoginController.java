package com.v_mom.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String login() {
        return "login"; // This will return the login.html template
    }



    @PostMapping("/login")
    public String processLogin(@RequestParam("email") String email,
                               @RequestParam("password") String password) {
        // هنا يمكنك إضافة منطق المصادقة - قم بتعديل هذا الكود وفقًا لمتطلباتك

        // كمثال بسيط، يمكنك تنفيذ المصادقة هكذا:
        // if (userService.authenticate(email, password)) {
        //     return "redirect:/dashboard";
        // } else {
        //     return "redirect:/login?error";
        // }

        // تحويل مؤقت للصفحة الرئيسية بعد تسجيل الدخول
        return "redirect:/home"; // قم بتعديل هذا الرابط وفقًا لاحتياجاتك
    }


    @GetMapping("/forgot-password")
    public String showForgotPasswordPage() {
        return "forgot-password";
    }
}
