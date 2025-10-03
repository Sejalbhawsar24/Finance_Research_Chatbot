import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common"
import type { MessagesService } from "./messages.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import type { MessageRole } from "@prisma/client"

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  async create(req, @Body() body: { threadId: string; role: MessageRole; content: string; metadata?: any }) {
    return this.messagesService.create({
      ...body,
      userId: req.user.id,
    })
  }

  @Get("thread/:threadId")
  async findByThread(
    @Param("threadId") threadId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.messagesService.findByThread(
      threadId,
      limit ? Number.parseInt(limit) : 100,
      offset ? Number.parseInt(offset) : 0,
    )
  }
}
