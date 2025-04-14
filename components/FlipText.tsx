"use client"

import { useEffect, useState, useRef } from 'react'

interface CharState {
  isFlipping: boolean;
  displayChar: string;
}

interface FlipTextProps {
  text: string
  className?: string
  charClassName?: string
  fontSize?: string
  color?: string
  sporadicFlip?: boolean
  flipInterval?: number  // How often flips occur in milliseconds
  flipProbability?: number // Probability of flip occurring (0-1)
}

// Component that renders a string with sporadic flip effects
export function FlipText({ 
  text, 
  className = '', 
  charClassName = '',
  fontSize = '2rem',
  color = '#FACC15',
  sporadicFlip = true,
  flipInterval = 7000,  // Default to 7 seconds
  flipProbability = 0.4 // 40% chance of flipping during each interval
}: FlipTextProps) {
  // Create an array of state for each character
  const [charStates, setCharStates] = useState<CharState[]>([]);
  
  // Initialize character states
  useEffect(() => {
    setCharStates(text.split('').map(char => ({
      isFlipping: false,
      displayChar: char
    })));
  }, [text]);
  
  // Set up sporadic flipping if enabled
  useEffect(() => {
    if (!sporadicFlip || charStates.length === 0) return;
    
    const interval = setInterval(() => {
      // Only flip if probability check passes
      if (Math.random() > flipProbability) return;
      
      // Choose random characters to flip
      const totalChars = text.length;
      if (totalChars === 0) return;
      
      // Randomly decide how many characters to flip (1-2)
      const numToFlip = Math.floor(Math.random() * 2) + 1;
      const indicesToFlip = new Set<number>();
      
      // Select random characters to flip
      while (indicesToFlip.size < numToFlip && indicesToFlip.size < totalChars) {
        indicesToFlip.add(Math.floor(Math.random() * totalChars));
      }
      
      // Trigger flips with slight variations in timing
      indicesToFlip.forEach(index => {
        setTimeout(() => {
          flipCharAtIndex(index);
        }, Math.random() * 300);
      });
    }, flipInterval);
    
    return () => clearInterval(interval);
  }, [sporadicFlip, text, charStates.length, flipInterval, flipProbability]);
  
  // Function to flip a specific character
  const flipCharAtIndex = (index: number) => {
    setCharStates(prevStates => {
      const newStates = [...prevStates];
      if (!newStates[index]) return prevStates;
      
      // Start flip animation
      newStates[index] = {
        ...newStates[index],
        isFlipping: true
      };
      
      // Schedule end of flip
      setTimeout(() => {
        setCharStates(latestStates => {
          const finalStates = [...latestStates];
          if (!finalStates[index]) return latestStates;
          
          finalStates[index] = {
            displayChar: text[index],
            isFlipping: false
          };
          
          return finalStates;
        });
      }, 200);
      
      return newStates;
    });
  };
  
  if (charStates.length === 0) {
    return <div className={className} style={{ minHeight: fontSize }}></div>;
  }
  
  return (
    <div className={`flip-text ${className}`}>
      {charStates.map((charState, index) => (
        <span 
          key={index}
          className={`inline-block flip-char ${charState.isFlipping ? 'flipping' : ''}`}
          style={{ 
            fontSize,
            color,
            fontFamily: "'Arial Narrow', 'Arial', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: 'bold',
            perspective: '1000px',
            margin: '0 1px',
            width: text[index] === ' ' ? '0.5em' : 'auto',
          }}
        >
          {charState.displayChar}
        </span>
      ))}
    </div>
  )
} 