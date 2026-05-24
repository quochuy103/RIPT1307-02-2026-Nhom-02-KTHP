package com.cutie_cuts_app.example.cutie_cuts_app.service;

import com.cutie_cuts_app.example.cutie_cuts_app.dto.domain.CreateReviewRequest;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.Review;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReviewValidationTest {

    private Validator validator;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void createReviewRequestRejectsRatingsOutsideRange() {
        CreateReviewRequest low = baseCreateReviewRequest();
        low.setRating(0);

        CreateReviewRequest high = baseCreateReviewRequest();
        high.setRating(6);

        assertEquals(1, validator.validate(low).size());
        assertEquals(1, validator.validate(high).size());
    }

    @Test
    void reviewEntityRejectsRatingsOutsideRange() {
        Review low = new Review();
        low.setRating(0);
        low.setComment("ok");

        Review high = new Review();
        high.setRating(6);
        high.setComment("ok");

        assertEquals(1, validator.validateProperty(low, "rating").size());
        assertEquals(1, validator.validateProperty(high, "rating").size());
    }

    @Test
    void validBoundaryRatingsPassValidation() {
        CreateReviewRequest min = baseCreateReviewRequest();
        min.setRating(1);

        CreateReviewRequest max = baseCreateReviewRequest();
        max.setRating(5);

        assertEquals(0, validator.validate(min).size());
        assertEquals(0, validator.validate(max).size());
    }

    private CreateReviewRequest baseCreateReviewRequest() {
        CreateReviewRequest request = new CreateReviewRequest();
        request.setOrderId(1L);
        request.setProductId(1L);
        request.setComment("ok");
        return request;
    }
}
