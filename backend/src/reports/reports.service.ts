import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { ReportFormat } from "@prisma/client"

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    threadId: string
    title: string
    content: string
    format?: ReportFormat
    citations: any
    metadata?: any
  }) {
    return this.prisma.report.create({
      data: {
        ...data,
        format: data.format || ReportFormat.MARKDOWN,
      },
    })
  }

  async findByThread(threadId: string) {
    return this.prisma.report.findMany({
      where: { threadId },
      orderBy: { createdAt: "desc" },
    })
  }

  async findOne(id: string) {
    return this.prisma.report.findUnique({ where: { id } })
  }
}
