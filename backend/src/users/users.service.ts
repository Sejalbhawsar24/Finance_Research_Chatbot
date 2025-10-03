import { PrismaService } from "@/prisma/prisma.service";
import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; password: string; name?: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new ConflictException("User already exists")
    }

    return this.prisma.user.create({ data })
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException("User not found")
    }
    return user
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async update(id: string, data: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
    })
  }
}
