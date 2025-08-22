package com.ibeus.Comanda.Digital.service;

import com.ibeus.Comanda.Digital.model.Dish;
import com.ibeus.Comanda.Digital.repository.DishRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.logging.Logger;

@Service
public class DishService {
    private static final Logger LOGGER = Logger.getLogger(DishService.class.getName());

    @Autowired
    private DishRepository dishRepository;

    public List<Dish> findAll() {
        LOGGER.info("Fetching all dishes");
        return dishRepository.findAll();
    }

    public Dish findById(Long id) {
        LOGGER.info("Fetching dish with ID: " + id);
        return dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dish not found with ID: " + id));
    }

    public Dish create(Dish dish) {
        LOGGER.info("Creating dish: " + dish.getName());
        if (dish.getName() == null || dish.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Dish name is required");
        }
        if (dish.getPrice() == null || dish.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than zero");
        }
        if (dish.getCategory() == null || dish.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (dish.getIngredients() == null) {
            dish.setIngredients("");
        }
        return dishRepository.save(dish);
    }

    public Dish update(Long id, Dish dish) {
        LOGGER.info("Updating dish with ID: " + id);
        Dish existingDish = findById(id);
        existingDish.setName(dish.getName());
        existingDish.setDescription(dish.getDescription());
        existingDish.setPrice(dish.getPrice());
        existingDish.setImageUrl(dish.getImageUrl());
        existingDish.setCategory(dish.getCategory());
        existingDish.setIngredients(dish.getIngredients());
        return dishRepository.save(existingDish);
    }

    public void delete(Long id) {
        LOGGER.info("Deleting dish with ID: " + id);
        dishRepository.deleteById(id);
    }

    public String uploadImage(MultipartFile file) throws IOException {
        LOGGER.info("Uploading image: " + file.getOriginalFilename());
        String uploadDir = "C:/Users/diego.oliveira/Documents/faculdade/4º Semestre/Desen. Fullstack/Comanda-Digital - Copy/Comanda-Digital/Uploads/";
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            LOGGER.info("Created upload directory: " + uploadPath);
        }
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath, file.getBytes());
        LOGGER.info("Image saved to: " + filePath);
        return "http://localhost:8080/Uploads/" + fileName;
    }
}