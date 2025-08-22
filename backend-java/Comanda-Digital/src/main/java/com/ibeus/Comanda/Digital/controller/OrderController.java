package com.ibeus.Comanda.Digital.controller;

import com.ibeus.Comanda.Digital.model.Order;
import com.ibeus.Comanda.Digital.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.logging.Logger;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    private static final Logger LOGGER = Logger.getLogger(OrderController.class.getName());

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        LOGGER.info("Received order: " + order);
        try {
            Order createdOrder = orderService.create(order);
            LOGGER.info("Created order with ID: " + createdOrder.getId());
            return ResponseEntity.ok(createdOrder);
        } catch (Exception e) {
            LOGGER.severe("Failed to create order: " + e.getMessage());
            throw e;
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        LOGGER.info("Fetching order with ID: " + id);
        Order order = orderService.findById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        LOGGER.info("Fetching all orders");
        List<Order> orders = orderService.findAll();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/customer/{customerName}")
    public ResponseEntity<List<Order>> getOrdersByCustomerName(@PathVariable String customerName) {
        LOGGER.info("Fetching orders for customer: " + customerName);
        List<Order> orders = orderService.findByCustomerName(customerName);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Order> updateOrder(@PathVariable Long id, @RequestBody Order order) {
        LOGGER.info("Updating order with ID: " + id);
        Order updatedOrder = orderService.update(id, order);
        return ResponseEntity.ok(updatedOrder);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody OrderStatusUpdate statusUpdate) {
        LOGGER.info("Updating status for order ID: " + id + " to " + statusUpdate.getStatus());
        Order updatedOrder = orderService.updateStatus(id, statusUpdate.getStatus());
        return ResponseEntity.ok(updatedOrder);
    }
}

class OrderStatusUpdate {
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}