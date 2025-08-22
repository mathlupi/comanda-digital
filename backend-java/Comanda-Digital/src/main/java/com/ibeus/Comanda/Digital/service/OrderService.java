package com.ibeus.Comanda.Digital.service;

import com.ibeus.Comanda.Digital.model.Order;
import com.ibeus.Comanda.Digital.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class OrderService {

    private static final Logger LOGGER = Logger.getLogger(OrderService.class.getName());

    @Autowired
    private OrderRepository orderRepository;

    public Order create(Order order) {
        LOGGER.info("Creating order for customer: " + order.getCustomerName());
        return orderRepository.save(order);
    }

    public Order findById(Long id) {
        LOGGER.info("Fetching order with ID: " + id);
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    public List<Order> findAll() {
        LOGGER.info("Fetching all orders");
        return orderRepository.findAll();
    }

    public List<Order> findByCustomerName(String customerName) {
        LOGGER.info("Fetching orders for customer: " + customerName);
        return orderRepository.findByCustomerName(customerName);
    }

    public Order update(Long id, Order order) {
        LOGGER.info("Updating order with ID: " + id);
        Order existingOrder = findById(id);
        existingOrder.setCustomerName(order.getCustomerName());
        existingOrder.setCustomerAddress(order.getCustomerAddress());
        existingOrder.setTotalPrice(order.getTotalPrice());
        existingOrder.setStatus(order.getStatus());
        try {
            existingOrder.setDishIdsList(order.getDishIdsList());
            existingOrder.setQuantitiesList(order.getQuantitiesList());
            existingOrder.setSelectedIngredientsList(order.getSelectedIngredientsList());
        } catch (Exception e) {
            LOGGER.severe("Error updating JSON fields: " + e.getMessage());
            throw new RuntimeException("Failed to update JSON fields", e);
        }
        return orderRepository.save(existingOrder);
    }

    public Order updateStatus(Long id, String status) {
        LOGGER.info("Updating status for order ID: " + id + " to " + status);
        Order existingOrder = findById(id);
        existingOrder.setStatus(status);
        return orderRepository.save(existingOrder);
    }
}