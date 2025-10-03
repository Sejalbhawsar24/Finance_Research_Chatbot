import { Module } from "@nestjs/common"
import { ThreadsService } from "./threads.service"
import { ThreadsController } from "./threads.controller"
import { PrismaModule } from "@/prisma/prisma.module"

@Module({
   imports: [PrismaModule],
  providers: [ThreadsService],
  controllers: [ThreadsController],
  exports: [ThreadsService],
})
export class ThreadsModule {}
