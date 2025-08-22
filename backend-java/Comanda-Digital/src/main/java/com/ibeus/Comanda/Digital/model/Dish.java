package com.ibeus.Comanda.Digital.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "dishes")
@Data
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String description;

    private Double price;

    private String imageUrl; // New field for image URL

    private String category; // New field for dish category (e.g., Main Course, Dessert)

    private String ingredients; // New field for ingredients list
}