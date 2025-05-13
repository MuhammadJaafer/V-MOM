package com.v_mom.security;



import com.v_mom.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  private final CustomUserDetailsService userDetailsService;
  private final CustomAuthenticationFailureHandler authFailureHandler;


  public SecurityConfig(
          CustomUserDetailsService userDetailsService,
          CustomAuthenticationFailureHandler authFailureHandler
  ) {
    this.userDetailsService = userDetailsService;
    this.authFailureHandler = authFailureHandler;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/", "/signup", "/login", "/css/**", "/js/**").permitAll()
                    .requestMatchers("/upload").authenticated()
                    .anyRequest().authenticated()
            )
            .formLogin(form -> form
                    .loginPage("/login")
                    .defaultSuccessUrl("/upload", true)
                    .failureHandler(authFailureHandler)
                    .successHandler((request, response, authentication) -> response.sendRedirect("/upload"))
            )
            .logout(logout -> logout
                    .logoutSuccessUrl("/?logout")
                    .permitAll()
            );

    return http.build();
  }

  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    authProvider.setHideUserNotFoundExceptions(false);
    return authProvider;
  }

  @Bean
  public BCryptPasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}