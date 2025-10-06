import { PrismaService } from "@/prisma/prisma.service";
import { Injectable } from "@nestjs/common"
import { MessageRole } from "@prisma/client"

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { threadId: string; userId: string; role: MessageRole; content: string; metadata?: any }) {
    return this.prisma.message.create({ data })
  }

  async findByThread(threadId: string, limit = 100, offset = 0) {
    return this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: limit,
      skip: offset,
    })
  }

  async count(threadId: string) {
    return this.prisma.message.count({ where: { threadId } })
  }
}
