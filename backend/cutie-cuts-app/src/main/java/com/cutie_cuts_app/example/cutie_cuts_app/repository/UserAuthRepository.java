package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.UserAuth;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, Long> {

    Optional<UserAuth> findByAuthTypeAndAuthValue(String authType, String authValue);

    Optional<UserAuth> findFirstByUserAndAuthTypeIgnoreCase(User user, String authType);

    Optional<UserAuth> findByResetOtpHash(String resetOtpHash);

    Optional<UserAuth> findByVerificationOtpHash(String verificationOtpHash);
}
