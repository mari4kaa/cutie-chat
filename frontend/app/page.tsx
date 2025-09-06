'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { api, BACKEND_WS } from './api-client';

import { ChatMessage } from '../../backend/src/common/types';

export default function Page() {
  const [users, setUsers] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  const socketRef = useRef<Socket | null>(null);

  // loading users list
  const loadUsers = async () => {
    const list = await api<string[]>('/users');
    setUsers(list);
  };

  useEffect(() => { loadUsers(); }, []);

  // managing socket connection per currentUser
  useEffect(() => {
    // cleanup previous socket
    socketRef.current?.disconnect();
    if (!currentUser) return;

    const s = io(BACKEND_WS, { transports: ['websocket'] });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('register', { username: currentUser });
    });
    s.on('registered', () => {
      console.log('Registered as', currentUser);
    });
    s.on('register_error', (p) => alert(p?.error || 'Register error'));

    s.on('new_message', (msg: ChatMessage) => {
      // appending if this message belongs to current convo
      if (
        (msg.from === currentUser && msg.to === recipient) ||
        (msg.from === recipient && msg.to === currentUser)
      ) {
        setMessages((m) => [...m, msg]);
        scrollToBottom();
      }
    });

    s.on('message_deleted', (msg: ChatMessage & { deleted?: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
      );
    });    

    s.on('delete_error', (p: { error: string }) => {
      alert(p?.error || 'Failed to delete message');
    });    

    return () => { s.disconnect(); };
  }, [currentUser, recipient]);

  // loading conversation history when currentUser or recipient changes
  useEffect(() => {
    const fetchHistory = async () => {
      if (currentUser && recipient) {
        const hist = await api<ChatMessage[]>(`/messages?userA=${encodeURIComponent(currentUser)}&userB=${encodeURIComponent(recipient)}`);
        setMessages(hist);
        setTimeout(scrollToBottom, 0);
      } else {
        setMessages([]);
      }
    };
    fetchHistory();
  }, [currentUser, recipient]);

  async function createUser() {
    if (!newUsername.trim()) return;
    await api('/users', { method: 'POST', body: JSON.stringify({ username: newUsername.trim() }) });
    setNewUsername('');
    await loadUsers();
  }

  function send() {
    const s = socketRef.current;
    if (!s || !currentUser || !recipient || !text.trim()) return;
    s.emit('send_message', { to: recipient, text: text.trim() });
    setText('');
  }

  function deleteMessage(id: string) {
    const s = socketRef.current;
    if (!s) return;
    s.emit('delete_message', { id });
  }

  const convoTitle = useMemo(() => {
    if (currentUser && recipient) return `${currentUser} ↔ ${recipient}`;
    if (currentUser) return `Logged in as ${currentUser}`;
    return 'Pick or create a user';
  }, [currentUser, recipient]);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Users / Accounts Panel */}
      <section className="md:col-span-1 bg-white rounded-2xl shadow p-4 space-y-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2"
            placeholder="new username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createUser()}
          />
          <button className="px-3 py-2 rounded-xl bg-black text-white" onClick={createUser}>Add</button>
        </div>
        <div className="max-h-80 overflow-auto divide-y">
          {users.map((u) => (
            <div key={u} className={`flex items-center justify-between py-2 ${u === currentUser ? 'font-semibold' : ''}`}>
              <span>{u}</span>
              <div className="flex gap-2">
                <button
                  className={`px-2 py-1 rounded-lg border ${u === currentUser ? 'bg-gray-900 text-white' : ''}`}
                  onClick={() => setCurrentUser(u)}
                >Use</button>
                <button
                  className="px-2 py-1 rounded-lg border"
                  onClick={() => setRecipient(u)}
                  disabled={!currentUser || u === currentUser}
                >Chat</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Panel */}
      <section className="md:col-span-2 bg-white rounded-2xl shadow flex flex-col">
        <header className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{convoTitle}</h2>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-xl px-3 py-2"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={!currentUser}
            >
              <option value="">Select recipient</option>
              {users.filter((u) => u !== currentUser).map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`relative max-w-[70%] p-3 rounded-2xl shadow ${
              m.from === currentUser ? 'ml-auto bg-gray-900 text-white' : 'mr-auto bg-gray-100'
            }`}
          >
            <div className="text-xs opacity-70 mb-1">
              {m.from} · {new Date(m.timestamp).toLocaleTimeString()}
            </div>

            <div>{m.deleted ? <i className="opacity-60">This message was deleted</i> : m.text}</div>

            {m.from === currentUser && !m.deleted && (
              <button
                onClick={() => deleteMessage(m.id.toString())}
                className="absolute top-1 right-2 text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        ))}
          <div ref={bottomRef} />
        </div>

        <footer className="p-4 border-t flex gap-2">
          <input
            className="flex-1 border rounded-xl px-3 py-2"
            placeholder={currentUser ? (recipient ? `Message ${recipient}…` : 'Pick a recipient…') : 'Pick or create a user…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={!currentUser || !recipient}
          />
          <button className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40" onClick={send} disabled={!currentUser || !recipient || !text.trim()}>Send</button>
        </footer>
      </section>
    </div>
  );
}
