import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common"
import { UsersService } from "./users.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Request } from "express"

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  async getMe(req: Request) {
    const { password, ...user } = await this.usersService.findById(req.user.id)
    return user
  }

  @Patch("me")
  async updateMe(req: Request, @Body() body: { name?: string; email?: string }) {
    const { password, ...user } = await this.usersService.update(req.user.id, body)
    return user
  }
}
