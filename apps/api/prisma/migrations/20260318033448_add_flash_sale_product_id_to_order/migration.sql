-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "flash_sale_product_id" VARCHAR(32);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_flash_sale_product_id_fkey" FOREIGN KEY ("flash_sale_product_id") REFERENCES "flash_sale_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
