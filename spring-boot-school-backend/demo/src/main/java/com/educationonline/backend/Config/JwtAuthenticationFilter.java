package com.educationonline.backend.Config;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.educationonline.backend.entities.users;
import com.educationonline.backend.repositories.usersRepository;
import com.educationonline.backend.services.JwtService;
import com.educationonline.backend.services.TokenBlacklistService;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getServletPath();

if (path.startsWith("/api/v1/auth")) {
    filterChain.doFilter(request, response);
    return;
}
if (request.getRequestURI().startsWith("/api/v1/years")) {
    filterChain.doFilter(request, response);
    return;
}

System.out.println(" JWT FILTER ENTERED");
            final String authHeader = request.getHeader("Authorization");

            System.out.println("AUTH HEADER = " + authHeader);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        System.out.println("Received JWT: " + token);

        final String jwt = authHeader.substring(7);
        if (tokenBlacklistService.isBlacklisted(jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String userEmail;
        try {
            userEmail = jwtService.extractEmail(jwt);
        } catch (ExpiredJwtException e) {
            // token expired — tell frontend to log in again
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Token expired. Please log in again.\"}");
            return;
        } catch (Exception e) {
            // any other token error
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Invalid token.\"}");
            return;
        }

        if (userEmail != null
                && SecurityContextHolder.getContext().getAuthentication() == null
                && jwtService.validateToken(jwt)) {

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(userEmail);

            // check if user is banned
            if (!userDetails.isEnabled()) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Account is banned.\"}");
                return;
            }

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        filterChain.doFilter(request, response);
    }
}
