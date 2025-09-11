//Citation: AI was used to help generate parts of this code.

import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  
  const texts = [
    'Hello World! 🌍',
    'Welcome to React! ⚛️',
    'Building Amazing Apps! 🚀',
    'Learning Never Stops! 📚'
  ];

  useEffect(() => {
    const currentText = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < currentText.length) {
          setDisplayText(currentText.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (currentIndex > 0) {
          setDisplayText(currentText.substring(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, textIndex, texts]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100
    });
  };

  return (
    <div className="App" onMouseMove={handleMouseMove}>
      <div 
        className="background-gradient"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
                      #667eea 0%, #764ba2 50%, #f093fb 100%)`
        }}
      >
        <div className="content-container">
          <div className="floating-elements">
            <div className="float-element">⭐</div>
            <div className="float-element">✨</div>
            <div className="float-element">🌟</div>
            <div className="float-element">💫</div>
            <div className="float-element">🔥</div>
          </div>
          
          <h1 className="typewriter-text">
            {displayText}
            <span className="cursor">|</span>
          </h1>
          
          <div className="pulse-circle"></div>
          
          <p className="subtitle">
            Interactive React Experience
          </p>
          
          <div className="button-container">
            <button 
              className="glow-button"
              onClick={() => {
                setDisplayText('');
                setCurrentIndex(0);
                setTextIndex((textIndex + 1) % texts.length);
              }}
            >
              Next Message
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .App {
          height: 100vh;
          overflow: hidden;
          font-family: 'Arial', sans-serif;
        }

        .background-gradient {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 0.3s ease;
        }

        .content-container {
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .floating-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .float-element {
          position: absolute;
          font-size: 2rem;
          opacity: 0.7;
          animation: float 6s ease-in-out infinite;
        }

        .float-element:nth-child(1) {
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .float-element:nth-child(2) {
          top: 10%;
          right: 20%;
          animation-delay: 1s;
        }

        .float-element:nth-child(3) {
          bottom: 20%;
          left: 20%;
          animation-delay: 2s;
        }

        .float-element:nth-child(4) {
          bottom: 10%;
          right: 10%;
          animation-delay: 3s;
        }

        .float-element:nth-child(5) {
          top: 50%;
          right: 5%;
          animation-delay: 4s;
        }

        .typewriter-text {
          font-size: 4rem;
          color: white;
          margin-bottom: 2rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          min-height: 5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cursor {
          animation: blink 1s infinite;
          margin-left: 5px;
        }

        .pulse-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          margin: 2rem auto;
          animation: pulse 2s ease-in-out infinite;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.5rem;
          margin-bottom: 3rem;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .button-container {
          margin-top: 2rem;
        }

        .glow-button {
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          border: none;
          padding: 15px 30px;
          color: white;
          font-size: 1.2rem;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .glow-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 25px rgba(0,0,0,0.3);
          filter: brightness(1.1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .typewriter-text {
            font-size: 2.5rem;
          }
          
          .subtitle {
            font-size: 1.2rem;
          }
          
          .pulse-circle {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
