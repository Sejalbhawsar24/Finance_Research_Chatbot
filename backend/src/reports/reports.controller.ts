import { Controller, Get, Post, Param, UseGuards, Res } from "@nestjs/common"
import type { Response } from "express"
import type { ReportsService } from "./reports.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { ReportFormat } from "@prisma/client"

@Controller("reports")
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  async create(body: {
    threadId: string
    title: string
    content: string
    format?: ReportFormat
    citations: any
    metadata?: any
  }) {
    return this.reportsService.create(body)
  }

  @Get("thread/:threadId")
  async findByThread(@Param("threadId") threadId: string) {
    return this.reportsService.findByThread(threadId)
  }

  @Get(":id/download")
  async download(@Param("id") id: string, @Res() res: Response) {
    const report = await this.reportsService.findOne(id)

    if (!report) {
      return res.status(404).json({ message: "Report not found" })
    }

    const filename = `${report.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${report.format === ReportFormat.HTML ? "html" : "md"}`

    res.setHeader("Content-Type", report.format === ReportFormat.HTML ? "text/html" : "text/markdown")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.send(report.content)
  }
}
