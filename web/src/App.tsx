import { useEffect, useState, useRef } from 'react'
import './App.css'

// CSS for popup animation
const popupStyles = `
@keyframes popup-appear {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
`;

// Achievement messages for different streak levels
const getAchievementData = (streak: number) => {
  if (streak >= 272) {
    return {
      title: "Congratulation!",
      message: "272問連続正解達成！全てを知っている貴方には脱帽します。",
      color: "#FF00FF", // Magenta
      borderColor: "magenta"
    };
  } else if (streak >= 72) {
    return {
      title: "Congratulation!",
      message: "72問連続正解達成！貴方なら軍団長になれるでしょう！",
      color: "#FF0000", // Red
      borderColor: "red"
    };
  } else if (streak >= 59) {
    return {
      title: "Congratulation!",
      message: "59問連続正解！ここまで生き残ったことに涙が止まりません！",
      color: "#9932CC", // Purple
      borderColor: "purple"
    };
  } else if (streak >= 39) {
    return {
      title: "Congratulation!",
      message: "39問連続正解！ここまで勝利し続けていただき、感謝しかありません！",
      color: "#1E90FF", // Blue
      borderColor: "blue"
    };
  } else if (streak >= 7) {
    return {
      title: "Congratulation!",
      message: "7問連続正解！貴方の幸運は戦巧者にふさわしい！",
      color: "#32CD32", // Green
      borderColor: "green"
    };
  } else {
    // Default case - no popup should be shown
    return {
      title: "",
      message: "",
      color: "transparent",
      borderColor: "transparent"
    };
  }
};

// Achievement popup component
const AchievementPopup = ({ streak, onClose }: { streak: number, onClose: () => void }) => {
  const achievementData = getAchievementData(streak);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        maxWidth: '80%',
        textAlign: 'center',
        boxShadow: `0 0 20px ${achievementData.color}`,
        border: `3px solid ${achievementData.borderColor}`,
        animation: 'popup-appear 0.5s ease-out',
      }}>
        <h2 style={{ color: achievementData.color, marginTop: 0 }}>{achievementData.title}</h2>
        <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
          <strong>{streak}問連続正解達成！</strong>
        </p>
        <p>{achievementData.message}</p>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: achievementData.color,
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

type Quiz = {
  audio_url: string
  options: string[]
  answer_index: number
  artist_info?: string
  scene_info?: string
}

// Function to get a value from session storage
const getStorageItem = (key: string): string | null => {
  try {
    // Use session storage in all environments
    return sessionStorage.getItem(key)
  } catch (error) {
    console.error('Session storage read error:', error)
    return null
  }
}

// Function to set a value in session storage
const setStorageItem = (key: string, value: string): void => {
  try {
    // Use session storage in all environments
    sessionStorage.setItem(key, value)
    console.log(`Saved to session storage: ${key}=${value}`) // For debugging
  } catch (error) {
    console.error('Session storage write error:', error)
  }
}

function App() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctStreak, setCorrectStreak] = useState(0)
  const [quizNumber, setQuizNumber] = useState(0)
  const [showAchievement, setShowAchievement] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const hasFetched = useRef(false)
  // Achievement thresholds are checked directly in handleClick

  const baseUrl = import.meta.env.VITE_API_BASE_URL



  // Load correct answer streak from storage on initial render
  useEffect(() => {
    console.log('Initial render: Attempting to load from storage')
    const savedStreak = getStorageItem('correctStreak')
    console.log('Saved streak count:', savedStreak)
    if (savedStreak) {
      const parsedStreak = parseInt(savedStreak, 10)
      console.log('Setting streak count to:', parsedStreak)
      setCorrectStreak(parsedStreak)
    }
  }, [])

  // Save to storage when correct answer streak changes
  useEffect(() => {
    // Don't save initial value of 0 (to avoid overwriting existing value)
    if (correctStreak > 0 || getStorageItem('correctStreak') === null) {
      console.log('Streak count changed:', correctStreak)
      setStorageItem('correctStreak', correctStreak.toString())
    }
  }, [correctStreak])

  useEffect(() => {
    if (quizNumber === 0 && hasFetched.current) return
    if (quizNumber === 0) hasFetched.current = true

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
        console.error('API call failed:', err)
        alert('Failed to fetch quiz data')
      })
  }, [quizNumber])

  if (!quiz || !Array.isArray(quiz.options)) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 'clamp(1rem, 4vw, 1.5rem)',
        padding: '1rem',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}>
        <p>Loading...</p>
      </div>
    )
  }

  const handleClick = (index: number) => {
    setSelectedIndex(index)
    const correct = index === quiz.answer_index
    setIsCorrect(correct)
    
    if (correct) {
      const newStreak = correctStreak + 1
      setCorrectStreak(newStreak)
      
      // Check if achievement threshold is exactly matched
      if ([7, 39, 59, 72, 272].includes(newStreak)) {
        setShowAchievement(true)
      } else {
        setShowAchievement(false)
      }
    } else {
      setCorrectStreak(0)
      setShowAchievement(false)
    }
  }

  return (
    <div
      style={{
        backgroundImage: 'url("/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 'clamp(0.5rem, 2vw, 1rem)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#000',
        textAlign: 'center',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Add animation styles */}
      <style dangerouslySetInnerHTML={{ __html: popupStyles }} />
      
      {/* Achievement popup */}
      {showAchievement && (
        <AchievementPopup 
          streak={correctStreak} 
          onClose={() => setShowAchievement(false)} 
        />
      )}
      <div style={{ 
        padding: 'clamp(0.5rem, 2vw, 1rem)', 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
        maxWidth: '90%',
        width: 'min(400px, 95vw)',
        margin: '0 auto',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 2rem)', margin: 'clamp(0.5rem, 2vw, 1rem) 0' }}>🎵 イントロ72 🎵</h2>
        <h3 style={{ fontSize: 'clamp(0.9rem, 4vw, 1.5rem)', margin: 'clamp(0.3rem, 1.5vw, 0.8rem) 0' }}>連続正解: {correctStreak} 問</h3>
        <div style={{
          minHeight: 'clamp(1.5rem, 5vw, 2.5rem)'
        }}>
          {correctStreak >= 2 && (
            <p style={{ 
              color: 'orange', 
              fontWeight: 'bold',
              fontSize: 'clamp(0.8rem, 3vw, 1.2rem)',
              margin: 'clamp(0.3rem, 1vw, 0.6rem) 0'
            }}>
              ✨現在{correctStreak}問連続正解中！✨
            </p>
          )}
        </div>

        <audio 
          controls 
          controlsList="nodownload" 
          ref={audioRef} 
          src={quiz.audio_url} 
          style={{ 
            margin: 'clamp(0.5rem, 2vw, 1rem) 0', 
            maxWidth: '100%', 
            width: 'min(300px, 90%)',
            boxSizing: 'border-box'
          }} 
        />

        <div style={{ width: '100%', maxWidth: 'min(400px, 95%)', margin: '0 auto', color: '#fff' }}>
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
                  width: '100%',
                  padding: 'clamp(0.3rem, 1.5vw, 0.6rem) clamp(0.5rem, 2vw, 1rem)',
                  margin: 'clamp(0.3rem, 1vw, 0.5rem) 0',
                  backgroundColor,
                  color: '#fff',
                  cursor: selectedIndex === null ? 'pointer' : 'default',
                  fontSize: 'clamp(0.8rem, 3vw, 1rem)',
                  wordBreak: 'break-word',
                  borderRadius: 'clamp(0.3rem, 1vw, 0.5rem)'
                }}
              >
                {choice}
              </button>
            )
          })}
        </div>

        <div
          style={{
            minHeight: 'clamp(1.5rem, 5vw, 2.5rem)',
            transition: 'all 0.5s ease',
            overflow: 'hidden',
            marginTop: 'clamp(0.5rem, 2vw, 1rem)'
          }}
        >
          {/* Result display section */}
          <h3 style={{ 
            color: isCorrect !== null ? (isCorrect ? 'green' : 'red') : 'transparent', 
            margin: 0,
            fontSize: 'clamp(1rem, 4vw, 1.5rem)',
            visibility: isCorrect !== null ? 'visible' : 'hidden',
            height: 'clamp(1.5rem, 5vw, 2.5rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isCorrect !== null ? (isCorrect ? '🎉正解！' : '不正解…') : '　'}
          </h3>
          
          {/* Artist and Scene information section - always reserve space */}
          <div style={{
            marginTop: 'clamp(0.5rem, 2vw, 1rem)',
            fontSize: 'clamp(0.8rem, 3vw, 1rem)',
            color: '#333',
            minHeight: 'clamp(4rem, 12vw, 6rem)',
            opacity: selectedIndex !== null ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}>
            <p style={{ 
              margin: 'clamp(0.2rem, 1vw, 0.5rem) 0',
              height: 'clamp(1.5rem, 5vw, 2rem)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <strong style={{marginRight: '0.5rem'}}>Artist:</strong> 
              <span>{selectedIndex !== null && quiz.artist_info ? quiz.artist_info : '　'}</span>
            </p>
            <p style={{ 
              margin: 'clamp(0.2rem, 1vw, 0.5rem) 0',
              height: 'clamp(1.5rem, 5vw, 2rem)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <strong style={{marginRight: '0.5rem'}}>Scene:</strong> 
              <span>{selectedIndex !== null && quiz.scene_info ? quiz.scene_info : '　'}</span>
            </p>
          </div>
        
        </div>

        <div
          style={{
            minHeight: 'clamp(1.5rem, 5vw, 2.5rem)',
            transition: 'all 0.5s ease',
            overflow: 'hidden',
            marginBottom: 'clamp(0.8rem, 3vw, 1.5rem)'
          }}>
          {isCorrect !== null && (
            <button
              onClick={() => setQuizNumber((prev) => prev + 1)}
              style={{ 
                marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
                fontSize: 'clamp(0.8rem, 3vw, 1rem)',
                padding: 'clamp(0.3rem, 1.5vw, 0.6rem) clamp(0.5rem, 2vw, 1rem)',
                borderRadius: 'clamp(0.3rem, 1vw, 0.5rem)'
              }}
            >
              次の戦場へ ▶️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default App