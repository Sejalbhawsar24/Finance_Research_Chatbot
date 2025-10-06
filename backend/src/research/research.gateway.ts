import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io"
import { ResearchService } from "./research.service"
import { MessagesService } from "../messages/messages.service"
import { SourcesService } from "../sources/sources.service"
import { MessageRole } from "@prisma/client"

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ResearchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(
    private researchService: ResearchService,
    private messagesService: MessagesService,
    private sourcesService: SourcesService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage("research")
  async handleResearch(
    client: Socket,
    data: { query: string; threadId: string; userId: string; showThinking?: boolean },
  ) {
    try {
      // Save user message
      await this.messagesService.create({
        threadId: data.threadId,
        userId: data.userId,
        role: MessageRole.USER,
        content: data.query,
      })

      // Stream from Python agent
      const stream = await this.researchService.streamResearch(
        data.query,
        data.threadId,
        data.userId,
        data.showThinking ?? true,
      )

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let fullAnswer = ""
      const sources = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const eventData = JSON.parse(line.slice(6))

            // Forward to client
            client.emit("research_event", eventData)

            // Collect data for saving
            if (eventData.type === "answer") {
              fullAnswer += eventData.content
            } else if (eventData.type === "sources") {
              sources.push(...eventData.content)
            } else if (eventData.type === "done") {
              // Save assistant message
              await this.messagesService.create({
                threadId: data.threadId,
                userId: data.userId,
                role: MessageRole.ASSISTANT,
                content: fullAnswer,
                metadata: {
                  thinking_trace: eventData.content.thinking_trace,
                },
              })

              // Save sources
              for (const source of sources) {
                await this.sourcesService.create({
                  threadId: data.threadId,
                  ...source,
                })
              }
            }
          }
        }
      }
    } catch (error) {
      client.emit("research_error", { message: error.message })
    }
  }
}
