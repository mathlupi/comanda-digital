package com.ibeus.Comanda.Digital.controller;

import com.ibeus.Comanda.Digital.model.Dish;
import com.ibeus.Comanda.Digital.service.DishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;

@RestController
@RequestMapping("/dishes")
@CrossOrigin(origins = "http://localhost:4200")
public class DishController {
    private static final Logger LOGGER = Logger.getLogger(DishController.class.getName());

    @Autowired
    private DishService dishService;

    @GetMapping
    public ResponseEntity<List<Dish>> getAllDishes() {
        LOGGER.info("Fetching all dishes");
        List<Dish> dishes = dishService.findAll();
        return ResponseEntity.ok(dishes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Dish> getDishById(@PathVariable Long id) {
        LOGGER.info("Fetching dish with ID: " + id);
        try {
            Dish dish = dishService.findById(id);
            return ResponseEntity.ok(dish);
        } catch (RuntimeException e) {
            LOGGER.severe("Error fetching dish: " + e.getMessage());
            return ResponseEntity.status(404).body(null);
        }
    }

    @PostMapping
    public ResponseEntity<Dish> createDish(@RequestBody Dish dish) {
        LOGGER.info("Creating dish: " + dish.getName());
        try {
            Dish createdDish = dishService.create(dish);
            return ResponseEntity.ok(createdDish);
        } catch (IllegalArgumentException e) {
            LOGGER.severe("Error creating dish: " + e.getMessage());
            return ResponseEntity.status(400).body(null);
        } catch (Exception e) {
            LOGGER.severe("Unexpected error creating dish: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Dish> updateDish(@PathVariable Long id, @RequestBody Dish dish) {
        LOGGER.info("Updating dish with ID: " + id);
        try {
            Dish updatedDish = dishService.update(id, dish);
            return ResponseEntity.ok(updatedDish);
        } catch (RuntimeException e) {
            LOGGER.severe("Error updating dish: " + e.getMessage());
            return ResponseEntity.status(404).body(null);
        } catch (Exception e) {
            LOGGER.severe("Unexpected error updating dish: " + e.getMessage());
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDish(@PathVariable Long id) {
        LOGGER.info("Deleting dish with ID: " + id);
        try {
            dishService.delete(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            LOGGER.severe("Error deleting dish: " + e.getMessage());
            return ResponseEntity.status(404).build();
        } catch (Exception e) {
            LOGGER.severe("Unexpected error deleting dish: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        LOGGER.info("Uploading image: " + file.getOriginalFilename());
        try {
            String imageUrl = dishService.uploadImage(file);
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            LOGGER.severe("Error uploading image: " + e.getMessage());
            return ResponseEntity.status(500).body("Error uploading image: " + e.getMessage());
        }
    }
}