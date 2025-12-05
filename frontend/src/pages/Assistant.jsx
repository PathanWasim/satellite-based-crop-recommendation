import React, { useState, useRef, useEffect } from 'react';
import {
    Bot, Send, User, Loader2, Trash2, Sparkles,
    Leaf, Cloud, Bug, Droplets, HelpCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Assistant.css';

const GEMINI_API_KEY = 'AIzaSyAapEVkK5rCN__SIKWl0JInai4DIr8tXVU';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `You are GeoCrop AI Assistant, a helpful farming and agriculture expert. You help farmers with:
- Crop recommendations based on soil and weather conditions
- Pest and disease identification and treatment
- Irrigation and water management advice
- Fertilizer recommendations
- Seasonal planting guides
- Weather impact on crops
- Soil health improvement tips
- Market trends and crop pricing

Keep responses concise, practical, and farmer-friendly. Use simple language. 
If asked about non-farming topics, politely redirect to agriculture-related help.
Format responses with bullet points when listing multiple items.
Include emojis occasionally to make responses engaging.`;

const Assistant = () => {
    const toast = useToast();
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('geocrop_chat_history');
        return saved ? JSON.parse(saved) : [
            {
                role: 'assistant',
                content: "👋 Hello! I'm your GeoCrop AI Assistant. I can help you with:\n\n• Crop recommendations\n• Pest & disease management\n• Soil health tips\n• Weather-based farming advice\n• Irrigation guidance\n\nHow can I help you today?"
            }
        ];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('geocrop_chat_history', JSON.stringify(messages));
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history for context
            const conversationHistory = messages.slice(-6).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
                        { role: 'model', parts: [{ text: 'I understand. I am GeoCrop AI Assistant, ready to help with farming and agriculture questions.' }] },
                        ...conversationHistory,
                        { role: 'user', parts: [{ text: input.trim() }] }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();
            const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        } catch (error) {
            console.error('Gemini API error:', error);
            toast.error('Failed to get response. Please try again.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again or check your internet connection.'
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        if (window.confirm('Clear all chat history?')) {
            setMessages([{
                role: 'assistant',
                content: "👋 Chat cleared! How can I help you with your farming questions?"
            }]);
            toast.success('Chat history cleared');
        }
    };

    const quickPrompts = [
        { icon: Leaf, text: 'Best crops for winter season?', color: 'green' },
        { icon: Bug, text: 'How to control pests naturally?', color: 'red' },
        { icon: Droplets, text: 'Irrigation tips for summer', color: 'blue' },
        { icon: Cloud, text: 'Protect crops from heavy rain', color: 'purple' }
    ];

    const handleQuickPrompt = (prompt) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    return (
        <div className="assistant-page">
            <div className="assistant-container">
                {/* Header */}
                <div className="assistant-header">
                    <div className="header-info">
                        <div className="assistant-avatar">
                            <Bot size={24} />
                            <Sparkles size={12} className="sparkle" />
                        </div>
                        <div>
                            <h1>GeoCrop AI Assistant</h1>
                            <span className="status">
                                <span className="status-dot"></span>
                                Powered by Gemini AI
                            </span>
                        </div>
                    </div>
                    <button className="clear-btn" onClick={clearChat} title="Clear chat">
                        <Trash2 size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="messages-container">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.role}`}>
                            <div className="message-avatar">
                                {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                            </div>
                            <div className="message-content">
                                <div className="message-text">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message assistant">
                            <div className="message-avatar">
                                <Bot size={20} />
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length <= 2 && (
                    <div className="quick-prompts">
                        <p>Try asking:</p>
                        <div className="prompts-grid">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    className={`prompt-btn ${prompt.color}`}
                                    onClick={() => handleQuickPrompt(prompt.text)}
                                >
                                    <prompt.icon size={16} />
                                    {prompt.text}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="input-container">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about crops, soil, weather, pests..."
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="send-btn"
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                    >
                        {isLoading ? <Loader2 size={20} className="spinning" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
