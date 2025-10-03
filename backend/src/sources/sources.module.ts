import { Module } from "@nestjs/common"
import { SourcesService } from "./sources.service"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
  imports: [PrismaModule], 
  providers: [SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
