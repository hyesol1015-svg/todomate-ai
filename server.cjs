const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { CosmosClient } = require("@azure/cosmos");

// ==============================
// AI 설정
// ==============================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==============================
// Cosmos DB 설정
// ==============================

const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const container = database.container(process.env.COSMOS_CONTAINER);

// ==============================
// Express 설정
// ==============================

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==============================
// 서버 확인
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "TodoMate AI 서버가 정상적으로 실행되고 있습니다.",
  });
});

// ==============================
// Gemini 연결 확인
// ==============================

app.get("/test-ai", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "TodoMate AI 테스트입니다. 한국어로 한 문장만 답해주세요.",
    });

    res.json({
      success: true,
      answer: response.text,
    });
  } catch (error) {
    console.error("Gemini API 오류:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// Todo → AI 계획 생성
// ==============================

app.post("/api/plan", async (req, res) => {
  try {
    const { todos } = req.body;

    if (!Array.isArray(todos) || todos.length === 0) {
      return res.status(400).json({
        success: false,
        error: "분석할 Todo가 없습니다.",
      });
    }

    const todoText = todos
      .map((todo, index) => {
        return `${index + 1}. ${todo.title} ${
          todo.completed ? "(완료)" : "(미완료)"
        }`;
      })
      .join("\n");

    const prompt = `
너는 TodoMate AI의 일정 계획 전문가야.

사용자의 오늘 할 일 목록을 보고 현실적인 하루 계획을 만들어줘.

사용자의 Todo:
${todoText}

규칙:
1. 완료된 Todo는 계획에서 제외한다.
2. 미완료 Todo를 중요도와 집중력을 고려해 배치한다.
3. 오전에는 집중력이 필요한 공부나 어려운 일을 배치한다.
4. 오후에는 수정, 작성 등의 작업을 배치한다.
5. 저녁에는 비교적 가벼운 일을 배치한다.
6. 같은 종류의 일을 가능한 한 묶는다.
7. 계획은 너무 빡빡하지 않게 현실적으로 만든다.
8. 각 Todo에 대해 적절한 시작 시간을 정한다.
9. 시간은 09:00, 10:30, 14:00처럼 24시간 형식으로 작성한다.

반드시 아래 JSON 형식으로만 답해줘.

{
  "plan": [
    {
      "time": "09:00",
      "title": "할 일 제목",
      "reason": "이 시간에 배치한 이유"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text);

    res.json({
      success: true,
      plan: result.plan,
    });
  } catch (error) {
    console.error("AI 계획 생성 오류:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// Cosmos DB 연결 확인
// ==============================

app.get("/api/db-test", async (req, res) => {
  try {
    const { resources } = await container.items
      .query("SELECT TOP 1 * FROM c")
      .fetchAll();

    res.json({
      success: true,
      message: "Cosmos DB 연결 성공!",
      data: resources,
    });
  } catch (error) {
    console.error("Cosmos DB 오류:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// Todo 저장
// ==============================

app.post("/api/todos", async (req, res) => {
  try {
    const { title, userId = "hyesol" } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Todo 제목이 필요합니다.",
      });
    }

    const todo = {
      id: Date.now().toString(),
      userId,
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.items.create(todo);

    res.json({
      success: true,
      todo: resource,
    });
  } catch (error) {
    console.error("Todo 저장 오류:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// Todo 목록 불러오기
// ==============================

app.get("/api/todos", async (req, res) => {
  try {
    const userId = req.query.userId || "hyesol";

    const { resources } = await container.items
      .query({
        query:
          "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC",
        parameters: [
          {
            name: "@userId",
            value: userId,
          },
        ],
      })
      .fetchAll();

    res.json({
      success: true,
      todos: resources,
    });
  } catch (error) {
    console.error("Todo 불러오기 오류:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ==============================
// 서버 실행
// ==============================

app.listen(PORT, () => {
  console.log(`TodoMate AI server running on port ${PORT}`);
});
