-- AddForeignKey
ALTER TABLE "act_section_items" ADD CONSTRAINT "act_section_items_treasureId_fkey" FOREIGN KEY ("treasureId") REFERENCES "treasures"("treasure_id") ON DELETE CASCADE ON UPDATE CASCADE;
