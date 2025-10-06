import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request} from "@nestjs/common"
import { ThreadsService } from "./threads.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"

@Controller("threads")
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(private threadsService: ThreadsService) {}

  @Post()
  async create(@Body() body: { title?: string }, @Request() req) {
    return this.threadsService.create(req.user.id, body.title);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.threadsService.findAll(
      req.user.id,
      limit ? Number.parseInt(limit) : 50,
      offset ? Number.parseInt(offset) : 0
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    return this.threadsService.findOne(id, req.user.id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: { title?: string },
    @Request() req
  ) {
    return this.threadsService.update(id, req.user.id, body);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Request() req) {
    return this.threadsService.delete(id, req.user.id);
  }
}
