package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.Notification;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import com.cutie_cuts_app.example.cutie_cuts_app.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService, CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public Map<String, Object> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        User user = getUser(authentication);
        Page<Notification> notifications = notificationService.getNotifications(user, page, size);
        return toPageResponse(notifications);
    }

    @GetMapping("/unread-count")
    public Map<String, Object> getUnreadCount(Authentication authentication) {
        User user = getUser(authentication);
        long count = notificationService.getUnreadCount(user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("unreadCount", count);
        return response;
    }

    @PatchMapping("/{id}/read")
    public Map<String, Object> markAsRead(@PathVariable Long id, Authentication authentication) {
        User user = getUser(authentication);
        notificationService.markAsRead(id, user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        return response;
    }

    @PostMapping("/read-all")
    public Map<String, Object> markAllAsRead(Authentication authentication) {
        User user = getUser(authentication);
        int count = notificationService.markAllAsRead(user);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("markedCount", count);
        return response;
    }

    private User getUser(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }
        return currentUserService.getByEmail(authentication.getName());
    }

    private Map<String, Object> toPageResponse(Page<Notification> page) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("data", page.getContent().stream().map(this::toResponse).toList());
        response.put("meta", Map.of(
                "total", page.getTotalElements(),
                "page", page.getNumber(),
                "size", page.getSize(),
                "totalPages", page.getTotalPages()
        ));
        return response;
    }

    private Map<String, Object> toResponse(Notification n) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", n.getId());
        map.put("type", n.getType());
        map.put("message", n.getMessage());
        map.put("referenceType", n.getReferenceType());
        map.put("referenceId", n.getReferenceId());
        map.put("isRead", n.getIsRead());
        map.put("createdAt", n.getCreatedAt() == null ? "" : n.getCreatedAt().toString().substring(0, 19));
        return map;
    }
}
