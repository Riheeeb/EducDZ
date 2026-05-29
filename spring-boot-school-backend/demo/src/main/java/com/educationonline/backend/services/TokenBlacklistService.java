package com.educationonline.backend.services;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class TokenBlacklistService {

    private final Map<String, Date> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, Date expiration) {
        if (token == null || token.isBlank()) {
            return;
        }

        blacklistedTokens.put(token, expiration);
        cleanupExpiredTokens();
    }

    public boolean isBlacklisted(String token) {
        cleanupExpiredTokens();

        Date expiration = blacklistedTokens.get(token);
        if (expiration == null) {
            return false;
        }

        if (expiration.before(new Date())) {
            blacklistedTokens.remove(token);
            return false;
        }

        return true;
    }

    private void cleanupExpiredTokens() {
        Date now = new Date();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() == null || entry.getValue().before(now));
    }
}
