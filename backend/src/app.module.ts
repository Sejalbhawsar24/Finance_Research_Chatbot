import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { ThreadsModule } from "./threads/threads.module"
import { MessagesModule } from "./messages/messages.module"
import { SourcesModule } from "./sources/sources.module"
import { ReportsModule } from "./reports/reports.module"
import { ResearchModule } from "./research/research.module"
import { PrismaModule } from "./prisma/prisma.module"
import { RedisModule } from "./redis/redis.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ThreadsModule,
    MessagesModule,
    SourcesModule,
    ReportsModule,
    ResearchModule,
  ],
})
export class AppModule {}
