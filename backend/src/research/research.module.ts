import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ResearchGateway } from "./research.gateway"
import { ResearchService } from "./research.service"
import { MessagesModule } from "../messages/messages.module"
import { SourcesModule } from "../sources/sources.module"
import { PrismaModule } from "@/prisma/prisma.module"
import { AuthModule } from "@/auth/auth.module"

@Module({
  imports: [
    ConfigModule.forRoot(),
    MessagesModule,
    SourcesModule,
    PrismaModule,
    AuthModule,
  ],
  providers: [ResearchGateway, ResearchService],
})
export class ResearchModule {}
