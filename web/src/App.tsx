import { useEffect, useState, useRef } from 'react'
import './App.css'

type Quiz = {
  audio_url: string
  options: string[]
  answer_index: number
}

function App() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [quizNumber, setQuizNumber] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const baseUrl = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    fetch(`${baseUrl}/quiz`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data)
        setSelectedIndex(null)
        setIsCorrect(null)
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.volume = 0.3
          }
        }, 0)
      })
      .catch((err) => {
        console.error('API呼び出し失敗:', err)
        alert('クイズデータの取得に失敗しました')
      })
  }, [quizNumber])

  if (!quiz || !Array.isArray(quiz.options)) {
    return <p>読み込み中...</p>
  }

  const handleClick = (index: number) => {
    setSelectedIndex(index)
    const correct = index === quiz.answer_index
    setIsCorrect(correct)
    setCorrectStreak((prev) => (correct ? prev + 1 : 0))
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>🎵 イントロクイズ 🎵</h1>
      <h3>連続正解: {correctStreak} 問</h3>
      {correctStreak >= 3 && (
        <p style={{ color: 'gold', fontWeight: 'bold' }}>
          すごい！{correctStreak}問連続正解中！✨
        </p>
      )}

      <audio controls ref={audioRef} src={quiz.audio_url} />
      <div style={{ marginTop: '1rem' }}>
        {quiz.options.map((choice, index) => {
          const isSelected = index === selectedIndex
          const isAnswer = index === quiz.answer_index

          let backgroundColor = ''
          if (selectedIndex !== null) {
            if (isSelected && isAnswer) backgroundColor = 'lightgreen'
            else if (isSelected && !isAnswer) backgroundColor = 'lightcoral'
            else if (isAnswer) backgroundColor = 'lightgreen'
          }

          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={selectedIndex !== null}
              style={{
                display: 'block',
                margin: '0.5rem auto',
                padding: '0.5rem 1rem',
                cursor: selectedIndex === null ? 'pointer' : 'default'
              }}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {isCorrect !== null && (
        <>
          <h2 style={{ color: isCorrect ? 'green' : 'red' }}>
            {isCorrect ? '正解！🎉' : '不正解…😢'}
          </h2>
          <button
            onClick={() => setQuizNumber((prev) => prev + 1)}
            style={{ marginTop: '1rem' }}
          >
            次の問題へ ▶️
          </button>
        </>
      )}
    </div>
  )
}

export default App