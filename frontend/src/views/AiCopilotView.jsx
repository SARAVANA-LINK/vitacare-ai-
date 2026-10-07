import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Sparkles, ShieldCheck, AlertTriangle, Trash2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { api } from '../api/apiClient';
import { useTranslation } from '../i18n/LanguageContext';

export const AiCopilotView = () => {
  const { t, language, bcp47 } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [mode, setMode] = useState('simple'); // 'simple' | 'standard' | 'detailed'
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const samplePrompts = [
    t('suggestedMedsToday'),
    t('suggestedGlucose'),
    t('suggestedCompare'),
    t('suggestedHemoglobin')
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.getAiHistory();
      if (res.history && res.history.length > 0) {
        setMessages(res.history);
      } else {
        // Localized Welcome message
        setMessages([
          {
            role: 'assistant',
            content: `👋 **${t('welcomeBack')}!**\n\n${t('copilotSubtitle')}\n\n${t('disclaimerCopilot')}`,
            mode: 'simple',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [language]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice Input (Speech-to-Text with Regional Language Support)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('cameraNotSupported') || 'Voice recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = bcp47 || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
    }
  };

  // Text-to-Speech (TTS with Regional Language Voice)
  const handleReadAloud = (text) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = bcp47 || 'en-US';
    
    // Attempt to pick regional voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(bcp47.split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      mode: mode,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Pass selected language to AI backend
      const res = await api.askAiCopilot(text, mode, language);
      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        mode: res.mode,
        userDataCitations: res.userDataCitations || [],
        hasEmergencyWarning: res.hasEmergencyWarning || false,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: t('networkError'),
          mode: mode,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await api.clearAiHistory();
      setMessages([
        {
          role: 'assistant',
          content: `${t('disclaimerCopilot')}`,
          mode: mode,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2>{t('copilotTitle')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {t('copilotSubtitle')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Mode Selector */}
          <div className="mode-pills">
            <button
              className={`mode-pill-btn ${mode === 'simple' ? 'active' : ''}`}
              onClick={() => setMode('simple')}
              title={t('modeSimple')}
            >
              {t('modeSimple')}
            </button>
            <button
              className={`mode-pill-btn ${mode === 'standard' ? 'active' : ''}`}
              onClick={() => setMode('standard')}
              title={t('modeStandard')}
            >
              {t('modeStandard')}
            </button>
            <button
              className={`mode-pill-btn ${mode === 'detailed' ? 'active' : ''}`}
              onClick={() => setMode('detailed')}
              title={t('modeDetailed')}
            >
              {t('modeDetailed')}
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleClearChat} title={t('clear')}>
            <Trash2 size={14} /> {t('clear')}
          </button>
        </div>
      </div>

      {/* Main Copilot Box */}
      <div className="copilot-panel">
        <div className="copilot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Bot size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--navy)' }}>{t('copilotTitle')}</strong>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                {t('clinicalGrounding')} • {mode.toUpperCase()}
              </div>
            </div>
          </div>
          <span className="badge badge-demo">SAFETY PROTECTED</span>
        </div>

        {/* Chat Feed */}
        <div className="copilot-chat-feed">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}
              style={{
                border: m.hasEmergencyWarning ? '2px solid var(--status-red)' : undefined,
                background: m.hasEmergencyWarning ? '#fef2f2' : undefined
              }}
            >
              <div style={{ whiteSpace: 'pre-line' }}>{m.content}</div>

              {/* Citations Box for User Data */}
              {m.userDataCitations && m.userDataCitations.length > 0 && (
                <div className="chat-citation-box">
                  <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> {t('clinicalGrounding')}:
                  </div>
                  <ul style={{ paddingLeft: '16px', margin: 0 }}>
                    {m.userDataCitations.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Voice Read Aloud trigger for assistant responses */}
              {m.role === 'assistant' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleReadAloud(m.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      padding: 0
                    }}
                    title={isSpeaking ? t('stopReading') : t('readAloud')}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? t('stopReading') : t('readAloud')}</span>
                  </button>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {m.role === 'user' && (
                <div style={{
                  fontSize: '0.68rem',
                  color: 'rgba(255,255,255,0.7)',
                  marginTop: '6px',
                  textAlign: 'right'
                }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble chat-bubble-assistant" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              {t('pleaseWait')}
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Sample Prompt Chips */}
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg-alt)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => handleSendMessage(p)}
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-pill)', flexShrink: 0 }}
            >
              <Sparkles size={12} color="var(--primary)" /> {p}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Input */}
        <form
          className="copilot-input-area"
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        >
          <button
            type="button"
            className={`btn btn-secondary ${isListening ? 'active' : ''}`}
            onClick={toggleVoiceInput}
            style={{
              borderRadius: 'var(--radius-pill)',
              padding: '0 12px',
              background: isListening ? '#fee2e2' : undefined,
              borderColor: isListening ? '#fca5a5' : undefined,
              color: isListening ? '#dc2626' : undefined
            }}
            title={isListening ? t('voiceListening') : t('voiceInput')}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <input
            type="text"
            className="form-input"
            style={{ borderRadius: 'var(--radius-pill)' }}
            placeholder={isListening ? t('voiceListening') : t('askCopilotPlaceholder')}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-pill)', padding: '0 20px' }}
            disabled={loading || !inputMessage.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
