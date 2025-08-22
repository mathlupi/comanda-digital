package com.ibeus.Comanda.Digital.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_address")
    private String customerAddress;

    @Column(name = "total_price")
    private double totalPrice;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "dish_ids", columnDefinition = "TEXT")
    private String dishIds; // JSON string of dish IDs

    @Column(name = "quantities", columnDefinition = "TEXT")
    private String quantities; // JSON string of quantities

    @Column(name = "selected_ingredients", columnDefinition = "TEXT")
    private String selectedIngredients; // JSON string of selected ingredients per dish

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerAddress() { return customerAddress; }
    public void setCustomerAddress(String customerAddress) { this.customerAddress = customerAddress; }
    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @JsonProperty("dishIds")
    public List<Long> getDishIdsList() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(dishIds, mapper.getTypeFactory().constructCollectionType(List.class, Long.class));
    }

    @JsonProperty("dishIds")
    public void setDishIdsList(List<Long> dishIdsList) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        this.dishIds = mapper.writeValueAsString(dishIdsList);
    }

    @JsonProperty("quantities")
    public List<Integer> getQuantitiesList() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(quantities, mapper.getTypeFactory().constructCollectionType(List.class, Integer.class));
    }

    @JsonProperty("quantities")
    public void setQuantitiesList(List<Integer> quantitiesList) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        this.quantities = mapper.writeValueAsString(quantitiesList);
    }

    @JsonProperty("selectedIngredients")
    public List<DishIngredients> getSelectedIngredientsList() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(selectedIngredients, mapper.getTypeFactory().constructCollectionType(List.class, DishIngredients.class));
    }

    @JsonProperty("selectedIngredients")
    public void setSelectedIngredientsList(List<DishIngredients> selectedIngredientsList) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        this.selectedIngredients = mapper.writeValueAsString(selectedIngredientsList);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

class DishIngredients {
    private Long dishId;
    private List<String> ingredients;

    public Long getDishId() { return dishId; }
    public void setDishId(Long dishId) { this.dishId = dishId; }
    public List<String> getIngredients() { return ingredients; }
    public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }
}