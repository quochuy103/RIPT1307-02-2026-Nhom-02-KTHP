package com.cutie_cuts_app.example.cutie_cuts_app.controller;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.ReviewRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.service.CurrentUserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = {"http://localhost:8080", "http://localhost:5173"})
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final CurrentUserService currentUserService;

    public ReviewController(ReviewRepository reviewRepository, CurrentUserService currentUserService) {
        this.reviewRepository = reviewRepository;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return reviewRepository.findAll().stream().map(this::toResponse).toList();
    }

    @PostMapping
    public Map<String, Object> create(@RequestBody CreateReviewRequest request, Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        User user = currentUserService.getByEmail(authentication.getName());
        Review review = new Review();
        review.setUser(user);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Review saved = reviewRepository.save(review);

        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Review not found");
        }
        reviewRepository.deleteById(id);
    }

    private Map<String, Object> toResponse(Review review) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", review.getId());
        map.put("userName", review.getUser().getName());
        map.put("rating", review.getRating());
        map.put("comment", review.getComment());
        map.put("date", String.valueOf(review.getCreatedAt()).substring(0, 10));
        return map;
    }
}
