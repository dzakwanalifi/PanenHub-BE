-- Migration 006: Setup Full-Text Search untuk Products
-- Membuat kolom tsvector gabungan untuk pencarian title dan description

-- Tambahkan kolom untuk Full-Text Search
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS title_description_search tsvector;

-- Membuat fungsi untuk memperbarui kolom tsvector secara otomatis
CREATE OR REPLACE FUNCTION update_products_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.title_description_search := to_tsvector('indonesian', coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hapus trigger lama jika ada
DROP TRIGGER IF EXISTS products_search_update_trigger ON public.products;

-- Membuat trigger untuk menjalankan fungsi di atas saat ada perubahan
CREATE TRIGGER products_search_update_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_products_search_vector();

-- Hapus index lama jika ada
DROP INDEX IF EXISTS products_search_idx;

-- Membuat index GIN pada kolom tsvector untuk pencarian cepat
CREATE INDEX products_search_idx ON public.products USING GIN (title_description_search);

-- Update existing records dengan search vector
UPDATE public.products 
SET title_description_search = to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(description, ''))
WHERE title_description_search IS NULL;

-- Membuat index tambahan untuk performa filter dan sorting
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products (price);
CREATE INDEX IF NOT EXISTS products_store_id_idx ON public.products (store_id);
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC); 