package com.educationonline.backend.services;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.educationonline.backend.entities.users;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Service
public class JwtService {

    private final String SECRET_KEY = "graduation2026WebappForEducationOnlineASFinalProjectwithSecretKeyof256BITs";
    private final long Expiration_TIME = 1000L * 60 * 60 * 24; 

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(users user){
        Map<String, Object> claims = new HashMap<>();
        claims.put("accountType", user.getAccountType());
        claims.put("userId", user.getId());
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + Expiration_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)  
                .compact();
    }

    // Extract email from token
    public String extractEmail(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Extract expiration date from token
    public Date extractExpiration(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
    }

    // Validate token
    public boolean validateToken(String token){
        try {
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
            return !isTokenExpired(claims);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(Claims claims){
        return claims.getExpiration().before(new Date());
    }
}