import { PrismaService } from "@/prisma/prisma.service"
import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"

@Injectable()
export class ThreadsService {
  constructor(private prisma: PrismaService) {} 

  async create(userId: string, title?: string) {
    return this.prisma.thread.create({
      data: {
        userId,
        title: title || "New Research",
      },
    })
  }

  async findAll(userId: string, limit = 50, offset = 0) {
    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.thread.count({ where: { userId } }),
    ])

    return { threads, total }
  }

  async findOne(id: string, userId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
        sources: {
          orderBy: { accessedAt: "desc" },
        },
      },
    })

    if (!thread) {
      throw new NotFoundException("Thread not found")
    }

    if (thread.userId !== userId) {
      throw new ForbiddenException("Access denied")
    }

    return thread
  }

  async update(id: string, userId: string, data: { title?: string }) {
    const thread = await this.findOne(id, userId)
    return this.prisma.thread.update({
      where: { id: thread.id },
      data,
    })
  }

  async delete(id: string, userId: string) {
    const thread = await this.findOne(id, userId)
    await this.prisma.thread.delete({ where: { id: thread.id } })
    return { message: "Thread deleted" }
  }
}
