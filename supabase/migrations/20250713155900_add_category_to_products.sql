-- Migration: Add category column to products table
-- File: 20250713155900_add_category_to_products.sql

-- Add category column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT;
