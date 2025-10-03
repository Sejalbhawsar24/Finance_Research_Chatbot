import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class SourcesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    threadId: string
    url: string
    title?: string
    snippet?: string
    content?: string
    publishedAt?: Date
    metadata?: any
  }) {
    // Check for duplicate URLs in the same thread
    const existing = await this.prisma.source.findFirst({
      where: {
        threadId: data.threadId,
        url: data.url,
      },
    })

    if (existing) {
      return existing
    }

    return this.prisma.source.create({ data })
  }

  async findByThread(threadId: string) {
    return this.prisma.source.findMany({
      where: { threadId },
      orderBy: { accessedAt: "desc" },
    })
  }
}
