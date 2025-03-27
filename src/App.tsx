import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

interface EventData {
  count: number;
  time: number;
  type?: string;
  message?: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<EventData[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('http://localhost:8001/sse');
    
    // Connection opened
    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    // Event received
    eventSource.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data) as EventData;
        if (data.message) {
          console.log('Completion message received:', data.message);
          setCompleted(true);
          setConnected(false);
          eventSource.close();
        } else {
          setMessages((prevMessages) => [...prevMessages, data]);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    // Error handling
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setConnected(false);
      setError('Connection to server failed. Make sure the FastAPI server is running.');
      eventSource.close();
    };

    // Cleanup on component unmount
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + SSE + FastAPI</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <hr></hr>

      <h2>SSE</h2>
      <div className="status-indicator">
        Connection Status: &nbsp;
        <span className={connected ? 'connected' : completed ? 'completed' : 'disconnected'}>
          {connected ? 'Connected' : completed ? 'Completed' : 'Disconnected'}
        </span>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="message-container">
        <h2>Real-time Updates:</h2>
        {messages.length === 0 ? (
          <p>Waiting for messages...</p>
        ) : (
          <ul>
            {messages.map((msg, index) => (
              <li key={index}>
                {msg.type === 'completion' ? (
                  <span className="completion-message">{msg.message}</span>
                ) : (
                  <>Count: {msg.count} | Time: {new Date(msg.time * 1000).toLocaleTimeString()}</>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default App