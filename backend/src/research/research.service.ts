import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class ResearchService {
  private pythonAgentUrl: string

  constructor(private configService: ConfigService) {
    this.pythonAgentUrl = this.configService.get<string>("PYTHON_AGENT_URL") || "http://localhost:8001"
  }

  async streamResearch(query: string, threadId: string, userId: string, showThinking: boolean) {
    const response = await fetch(`${this.pythonAgentUrl}/research/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        thread_id: threadId,
        user_id: userId,
        show_thinking: showThinking,
      }),
    })

    if (!response.ok) {
      throw new Error(`Python agent error: ${response.statusText}`)
    }

    return response.body
  }
}
