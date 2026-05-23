import React, { createContext, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { api } from '../services/api';

export const WebSocketContext = createContext(null);

export default function WebSocketProvider({ children }) {
  const sessionId = useStore((state) => state.sessionId);
  const setWsConnected = useStore((state) => state.setWsConnected);
  const triggerNudge = useStore((state) => state.triggerNudge);
  const handleWsReroute = useStore((state) => state.handleWsReroute);
  
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = api.getWsUrl(sessionId);
    console.log(`🔌 Establishing WebSocket tunnel to: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket channel open.');
      setWsConnected(true);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket channel closed.');
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('⚠️ WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log('📥 Received WS Push Event:', payload);
        
        const { event_type, data } = payload;
        
        if (event_type === 'nudge') {
          triggerNudge(data.message);
        } else if (event_type === 'reroute') {
          handleWsReroute(data.new_path, data.active_index);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket JSON payload:', e);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, setWsConnected, triggerNudge, handleWsReroute]);

  return (
    <WebSocketContext.Provider value={wsRef.current}>
      {children}
    </WebSocketContext.Provider>
  );
}
