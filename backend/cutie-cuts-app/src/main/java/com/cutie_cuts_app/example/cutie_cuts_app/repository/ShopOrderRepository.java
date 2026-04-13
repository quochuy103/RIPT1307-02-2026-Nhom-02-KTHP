package com.cutie_cuts_app.example.cutie_cuts_app.repository;

import com.cutie_cuts_app.example.cutie_cuts_app.entity.ShopOrder;
import com.cutie_cuts_app.example.cutie_cuts_app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    List<ShopOrder> findByUser(User user);
}
