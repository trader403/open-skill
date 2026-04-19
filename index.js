import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

// 你的 API 公网地址（记得替换为最新的 Cloudflare Tunnel 地址）
const API_BASE = "https://holders-router-pty-improvements.trycloudflare.com";

const server = new Server(
  {
    name: "liquidity-oracle",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_liquidity",
        description: "检查加密货币交易对在指定交易所的流动性是否满足最低要求",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              description: "交易对符号，例如 BTC/USDT 或 SOL/USDC",
            },
            exchange: {
              type: "string",
              description: "交易所名称，支持 gateio, coinex, hyperliquid",
            },
          },
          required: ["symbol", "exchange"],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "check_liquidity") {
    const { symbol, exchange } = request.params.arguments;
    try {
      const response = await axios.post(`${API_BASE}/can-trade`, {
        symbol,
        exchange,
      });
      const data = response.data;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `查询失败: ${error.message}`,
          },
        ],
      };
    }
  }
  throw new Error(`未知工具: ${request.params.name}`);
});

// 启动服务器
const transport = new StdioServerTransport();
await server.connect(transport);
