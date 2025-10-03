import { Injectable, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common"
import Redis from "ioredis"

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    this.client.on("connect", () => {
      console.log("✅ Redis connected")
    })

    this.client.on("error", (err) => {
      console.error("❌ Redis error:", err)
    })
  }

  async onModuleDestroy() {
    await this.client.quit()
  }

  getClient(): Redis {
    return this.client
  }

  // Helper methods for common operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message)
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    const subscriber = this.client.duplicate()
    await subscriber.subscribe(channel)
    subscriber.on("message", (ch, msg) => {
      if (ch === channel) {
        callback(msg)
      }
    })
  }
}
