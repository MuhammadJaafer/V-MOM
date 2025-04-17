package com.v_mom;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class VMomApplication {

	public static void main(String[] args) {
		SpringApplication.run(VMomApplication.class, args);
	}
}
