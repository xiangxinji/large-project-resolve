package com.example.c;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class CUtils {
    public static void log(String message) {
        System.out.println(message);
    }
    
    public void readFile(Path path) throws IOException {
        Files.readAllLines(path);
    }
}
