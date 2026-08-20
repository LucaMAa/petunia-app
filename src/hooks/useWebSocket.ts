import { useEffect, useRef, useCallback } from 'react';
import { tokenStorage } from '../api/client';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://192.168.1.24:8080/ws';

type WsMessage = {
  event: string;
  payload: unknown;
};

type MessageHandler = (msg: WsMessage) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlers = useRef<MessageHandler>(onMessage);

  useEffect(() => {
    handlers.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(async () => {
    const token = await tokenStorage.getAccess();
    if (!token) return;

    const socket = new WebSocket(`${WS_URL}?token=${token}`);
    ws.current = socket;

    socket.onopen = () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    socket.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data);
        handlers.current(msg);
      } catch {}
    };

    socket.onclose = () => {
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    socket.onerror = (err) => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: string, payload: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  return { send, wsRef: ws };
}
