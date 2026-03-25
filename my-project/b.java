package com.example.b;

import java.util.HashMap;
import java.util.Map;
import com.example.c.CUtils;

public class BService {
    private CUtils utils;
    private Map<String, Object> cache = new HashMap<>();
    
    public void execute() {
        CUtils.log("BService executing");
    }
}
