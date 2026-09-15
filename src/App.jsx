import { useState } from 'react'
import './App.css'

function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: '중앙아시아 경제학 3장 공부', completed: false },
    { id: 2, text: '발표 PPT 5페이지 수정', completed: false },
    { id: 3, text: '일본어 리뷰 문구 작성', completed: true },
    { id: 4, text: '영어 단어 30개', completed: false },
  ])

  const [newTodo, setNewTodo] = useState('')
  const [showAiPlan, setShowAiPlan] = useState(false)

  // AI 계획
  const [aiPlan, setAiPlan] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    )
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const addTodo = () => {
    if (!newTodo.trim()) return

    const newItem = {
      id: Date.now(),
      text: newTodo,
      completed: false,
    }

    setTodos([...todos, newItem])
    setNewTodo('')
  }

  // 실제 Gemini AI에게 Todo를 보내 계획 생성
  const handleAiPlan = async () => {
    if (todos.length === 0) {
      setAiError('분석할 Todo가 없습니다.')
      setShowAiPlan(true)
      return
    }

    setAiLoading(true)
    setAiError('')
    setAiPlan([])
    setShowAiPlan(true)

    try {
      const response = await fetch('https://todomate-ai-api-hyesol-emekgganfnpbtgt.eastasia-01.azurewebsites.net/api/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todos: todos.map((todo) => ({
            id: todo.id,
            title: todo.text,
            completed: todo.completed,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI 계획을 생성하지 못했습니다.')
      }

      setAiPlan(data.plan || [])
    } catch (error) {
      console.error('AI 계획 생성 오류:', error)
      setAiError(
        'AI 계획을 불러오지 못했어요. 서버가 실행 중인지 확인해주세요.'
      )
    } finally {
      setAiLoading(false)
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length

  const progress =
    todos.length === 0
      ? 0
      : Math.round((completedCount / todos.length) * 100)

  return (
    <div className="app">

      {/* 상단 */}
      <header className="header">
        <div className="logo">TodoMate AI</div>
        <div className="profile">👤 혜솔</div>
      </header>

      <main className="main">

        {/* 인사 */}
        <section className="welcome">
          <p className="small-text">GOOD MORNING ☀️</p>
          <h1>안녕하세요, 혜솔님 👋</h1>
          <p>오늘도 하나씩 해볼까요?</p>
        </section>

        {/* 달성률 */}
        <section className="progress-card">
          <div className="progress-header">
            <div>
              <span>오늘의 달성률</span>
              <strong>{progress}%</strong>
            </div>

            <span>
              {completedCount} / {todos.length}
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* Todo */}
        <section className="todo-section">

          <div className="section-title">
            <h2>오늘의 할 일</h2>
            <span>{todos.length} tasks</span>
          </div>

          {/* Todo 추가 */}
          <div className="add-todo">
            <input
              type="text"
              placeholder="새로운 할 일을 입력하세요"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTodo()
                }
              }}
            />

            <button onClick={addTodo}>
              추가
            </button>
          </div>

          {/* Todo 목록 */}
          <div className="todo-list">

            {todos.map((todo) => (
              <div
                className={`todo-item ${
                  todo.completed ? 'completed' : ''
                }`}
                key={todo.id}
              >

                <button
                  className="check-button"
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed ? '✓' : ''}
                </button>

                <span className="todo-text">
                  {todo.text}
                </span>

                <button
                  className="delete-button"
                  onClick={() => deleteTodo(todo.id)}
                >
                  ×
                </button>

              </div>
            ))}

          </div>
        </section>

        {/* AI 버튼 */}
        <button
          className="ai-button"
          onClick={handleAiPlan}
          disabled={aiLoading}
        >
          {aiLoading
            ? '✨ AI가 계획을 만드는 중...'
            : '✨ AI에게 계획 맡기기'}
        </button>

      </main>

      {/* AI 계획 모달 */}
      {showAiPlan && (
        <div className="modal-background">

          <div className="ai-modal">

            <button
              className="modal-close"
              onClick={() => setShowAiPlan(false)}
            >
              ×
            </button>

            <div className="ai-icon">
              ✨
            </div>

            <p className="ai-label">
              TODOMATE AI
            </p>

            <h2>
              {aiLoading ? (
                <>
                  오늘의 계획을<br />
                  만들고 있어요!
                </>
              ) : (
                <>
                  오늘의 계획을<br />
                  만들어봤어요!
                </>
              )}
            </h2>

            <p className="ai-description">
              {aiLoading
                ? '현재 할 일을 분석해서 가장 효율적인 순서를 찾고 있어요.'
                : '현재 할 일을 분석해서 가장 효율적인 순서로 정리했어요.'}
            </p>

            {/* AI 로딩 */}
            {aiLoading && (
              <div className="plan-list">
                <div className="plan-item">
                  <div>
                    <strong>🤖 Gemini AI 분석 중...</strong>
                    <p>
                      할 일의 중요도와 집중력을 고려하고 있어요.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI 오류 */}
            {!aiLoading && aiError && (
              <div className="plan-list">
                <div className="plan-item">
                  <div>
                    <strong>⚠️ 계획을 만들지 못했어요.</strong>
                    <p>{aiError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* AI가 만든 실제 계획 */}
            {!aiLoading && !aiError && (
              <div className="plan-list">

                {aiPlan.length === 0 ? (
                  <div className="plan-item">
                    <div>
                      <strong>계획할 미완료 Todo가 없어요.</strong>
                      <p>모든 할 일을 완료했어요! 🎉</p>
                    </div>
                  </div>
                ) : (
                  aiPlan.map((item, index) => (
                    <div
                      className="plan-item"
                      key={`${item.time}-${index}`}
                    >
                      <span className="plan-time">
                        {item.time}
                      </span>

                      <div>
                        <strong>
                          {item.title}
                        </strong>

                        <p>
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))
                )}

              </div>
            )}

            <button
              className="confirm-plan"
              onClick={() => setShowAiPlan(false)}
            >
              좋아요, 이렇게 할게요 👍
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default App