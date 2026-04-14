'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Sparkles, Clock, Database,
  ChevronDown, ChevronRight, Building2, Loader2, Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { queryRAG, type RAGQueryResponse, type RAGSource } from '@/lib/api';
import { RAG_EXAMPLE_QUERIES, GHANA_REGIONS } from '@/lib/constants';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RAGSource[];
  retrieval_time?: number;
  generation_time?: number;
  num_sources?: number;
  timestamp: Date;
}

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [regionFilter] = useState('');
  const [topK] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Prevent body scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleSubmit = async (question?: string) => {
    const q = question || input.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const filters: Record<string, string | number> = {};
      if (regionFilter) filters.region = regionFilter;

      const response = await queryRAG({
        question: q,
        top_k: topK,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        retrieval_time: response.retrieval_time,
        generation_time: response.generation_time,
        num_sources: response.num_sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Provide a mock response when backend is unavailable
      const mockMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `I'd be happy to help answer your question about "${q}". However, the backend service is currently unavailable.\n\n**In a connected environment, I would:**\n- Search through Ghana's healthcare facility database\n- Retrieve relevant facilities using semantic search\n- Generate a comprehensive answer with citations\n\nPlease ensure the FastAPI backend is running at \`http://localhost:8000\` to use this feature.`,
        sources: [],
        retrieval_time: 0,
        generation_time: 0,
        num_sources: 0,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, mockMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="page-enter" style={{ height: 'calc(100vh - 64px)', display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        borderRight: '1px solid var(--border-primary)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'var(--bg-secondary)',
        overflowY: 'auto',
      }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Sparkles size={18} color="var(--accent)" />
            AI Assistant
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Ask questions about Ghana&apos;s healthcare data
          </p>
        </div>

        {/* Example Queries */}
        <div>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Try asking:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {RAG_EXAMPLE_QUERIES.slice(0, 1).map((q, i) => (
              <button
                key={i}
                className="btn btn-ghost btn-sm"
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  lineHeight: 1.4,
                  whiteSpace: 'normal',
                  color: 'var(--text-secondary)',
                }}
                onClick={() => handleSubmit(q)}
                disabled={loading}
              >
                💬 {q}
              </button>
            ))}
          </div>
        </div>

        {messages.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)', marginTop: 'auto' }} onClick={clearChat}>
            <Trash2 size={14} /> Clear Chat
          </button>
        )}
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}>
              <div
                className="animate-float"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(16, 185, 129, 0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <MessageSquare size={36} color="var(--primary-light)" />
              </div>
              <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Ask About Healthcare in Ghana
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 480, fontSize: '0.9375rem', lineHeight: 1.7 }}>
                Ask any question about healthcare facilities, regional performance, medical deserts,
                or service availability. The AI uses RAG to search through facility data and provide
                accurate, sourced answers.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.map((msg) => (
                <div key={msg.id} className="animate-fadeIn">
                  {msg.role === 'user' ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div className="chat-bubble-user">{msg.content}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="chat-bubble-ai">
                        <div style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>

                      {/* Metrics */}
                      {(msg.retrieval_time !== undefined || msg.num_sources !== undefined) && (
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          marginTop: '0.5rem',
                          paddingLeft: '0.5rem',
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                        }}>
                          {msg.retrieval_time !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Clock size={12} /> Retrieval: {msg.retrieval_time.toFixed(2)}s
                            </span>
                          )}
                          {msg.generation_time !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Sparkles size={12} /> Generation: {msg.generation_time.toFixed(2)}s
                            </span>
                          )}
                          {msg.num_sources !== undefined && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Database size={12} /> {msg.num_sources} sources
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="animate-fadeIn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: 4 }}>
                  <Loader2 size={18} className="animate-spin-slow" color="var(--primary-light)" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Searching facilities and generating answer…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          borderTop: '1px solid var(--border-primary)',
          padding: '1rem 1.5rem',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
            >
              <textarea
                ref={inputRef}
                id="rag-query-input"
                className="input"
                style={{
                  flex: 1,
                  minHeight: 44,
                  maxHeight: 120,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                placeholder="Ask about healthcare facilities in Ghana…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                rows={1}
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !input.trim()}
                style={{ minWidth: 48, height: 44 }}
              >
                {loading ? <Loader2 size={18} className="animate-spin-slow" /> : <Send size={18} />}
              </button>
            </form>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)', marginTop: '0.75rem', textAlign: 'center', lineHeight: 1.5 }}>
              <div>Powered by Databricks RAG • Semantic search over {formatNumber(986)} healthcare facilities</div>
              <div style={{ marginTop: '0.25rem' }}>© 2026 Virtue Foundation — Ghana Healthcare Intelligence Platform. Built for the Databricks × Accenture Hackathon.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}
