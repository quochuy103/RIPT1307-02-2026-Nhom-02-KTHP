package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class UsersController {

    private final UserRepository userRepository;

    public UsersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        Sort sort = Sort.by(
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("id"));
        return userRepository.findAll(sort).stream().map(this::toResponse).toList();
    }

    private static final Set<String> VALID_ROLES = Set.of("user", "admin");

    @GetMapping("/page")
    public Page<Map<String, Object>> getAllPaginated(
            @PageableDefault(size = 20, sort = { "createdAt", "id" }, direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo) {
        if (role != null && !role.isBlank() && !VALID_ROLES.contains(role.toLowerCase())) {
            throw new ResponseStatusException(BAD_REQUEST,
                    "Invalid role. Allowed: " + String.join(", ", VALID_ROLES));
        }
        String roleLower = role != null && !role.isBlank() ? role.toLowerCase() : null;
        String searchPattern = search != null && !search.isBlank()
                ? "%" + search.toLowerCase() + "%" : null;
        LocalDateTime from = createdFrom != null ? createdFrom.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime to = createdTo != null ? createdTo.atTime(LocalTime.MAX) : LocalDateTime.of(2099, 12, 31, 23, 59);
        return userRepository.findAllFiltered(roleLower, searchPattern, from, to, pageable).map(this::toResponse);
    }

    @PatchMapping("/{id}")
    public Map<String, Object> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (Boolean.TRUE.equals(user.getDeleted())) {
            throw new ResponseStatusException(BAD_REQUEST, "Deleted users cannot be updated");
        }

        String name = body.get("name");
        String phone = body.get("phone");

        if (name != null && !name.isBlank()) {
            user.setName(name.trim());
        }

        if (phone != null) {
            user.setPhone(phone.trim());
        }

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    @PatchMapping("/{id}/role")
    public Map<String, Object> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (Boolean.TRUE.equals(user.getDeleted())) {
            throw new ResponseStatusException(BAD_REQUEST, "Deleted users cannot be edited");
        }

        String role = body.getOrDefault("role", "USER").toUpperCase();
        user.setRole(role);
        User saved = userRepository.save(user);

        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        if (Boolean.TRUE.equals(user.getDeleted())) {
            return;
        }

        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private Map<String, Object> toResponse(User user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getAuthMethods() != null && !user.getAuthMethods().isEmpty() ? user.getAuthMethods().get(0).getAuthValue() : "");
        map.put("phone", user.getPhone() == null ? "" : user.getPhone());
        map.put("role", user.getRole() == null ? "user" : user.getRole().toLowerCase());
        map.put("createdAt", user.getCreatedAt() == null ? "" : user.getCreatedAt().toString().substring(0, 10));
        map.put("deleted", Boolean.TRUE.equals(user.getDeleted()));
        map.put("deletedAt", user.getDeletedAt() == null ? "" : user.getDeletedAt().toString().substring(0, 10));
        return map;
    }
}
