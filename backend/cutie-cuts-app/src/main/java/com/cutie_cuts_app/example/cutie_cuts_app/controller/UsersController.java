package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class UsersController {

    private final UserRepository userRepository;

    public UsersController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return userRepository.findAll().stream().map(user -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", user.getId());
            map.put("name", user.getName());
            map.put("email", user.getAuthMethods() != null && !user.getAuthMethods().isEmpty() ? user.getAuthMethods().get(0).getAuthValue() : "");
            map.put("phone", user.getPhone() == null ? "" : user.getPhone());
            map.put("role", user.getRole() == null ? "user" : user.getRole().toLowerCase());
            map.put("createdAt", user.getCreatedAt() == null ? "" : user.getCreatedAt().toString().substring(0, 10));
            return map;
        }).toList();
    }

    @PatchMapping("/{id}/role")
    public Map<String, Object> updateRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));

        String role = body.getOrDefault("role", "USER").toUpperCase();
        user.setRole(role);
        User saved = userRepository.save(user);

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", saved.getId());
        map.put("role", saved.getRole().toLowerCase());
        return map;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }
}
