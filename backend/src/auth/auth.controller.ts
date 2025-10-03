import { Controller, Post, UseGuards, Request, Get } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(body: { email: string; password: string; name?: string }) {
    return this.authService.register(body.email, body.password, body.name)
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req) {
    return this.authService.login(req.user)
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace("Bearer ", "")
    await this.authService.logout(token)
    return { message: "Logged out successfully" }
  }

  @Post("refresh")
  async refresh(body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token)
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@Request() req) {
    return req.user
  }
}
