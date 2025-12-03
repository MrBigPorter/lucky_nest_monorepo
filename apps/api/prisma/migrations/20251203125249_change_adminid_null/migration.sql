-- DropForeignKey
ALTER TABLE "public"."admin_operation_logs" DROP CONSTRAINT "admin_operation_logs_admin_id_fkey";

-- AlterTable
ALTER TABLE "admin_operation_logs" ALTER COLUMN "admin_id" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "admin_operation_logs" ADD CONSTRAINT "admin_operation_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;
