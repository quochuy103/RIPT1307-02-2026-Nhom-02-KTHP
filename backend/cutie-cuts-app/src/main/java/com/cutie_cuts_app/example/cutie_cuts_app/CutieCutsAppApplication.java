package com.cutie_cuts_app.example.cutie_cuts_app;

import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import com.cutie_cuts_app.example.cutie_cuts_app.repository.UserRepository;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import com.cutie_cuts_app.example.cutie_cuts_app.service.AuthService;


@SpringBootApplication
public class CutieCutsAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(CutieCutsAppApplication.class, args);
	}
}




