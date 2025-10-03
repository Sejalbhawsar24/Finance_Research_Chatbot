import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import * as bcrypt from "bcrypt"
import { PrismaService } from "../prisma/prisma.service"
import { UsersService } from "../users/users.service"

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user
      return result
    }
    return null
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id }
    const token = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: "30d" })

    // Store session in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt,
      },
    })

    return {
      access_token: token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }

  async register(email: string, password: string, name?: string) {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name,
    })

    const { password: _, ...result } = user
    return this.login(result)
  }

  async logout(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    })
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken)
      const session = await this.prisma.session.findFirst({
        where: { refreshToken },
      })

      if (!session) {
        throw new UnauthorizedException("Invalid refresh token")
      }

      const user = await this.usersService.findById(payload.sub)
      return this.login(user)
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token")
    }
  }

  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return session.user
  }
}
