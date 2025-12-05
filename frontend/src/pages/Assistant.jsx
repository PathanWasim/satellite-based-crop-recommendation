import React, { useState, useRef, useEffect } from 'react';
import {
    Bot, Send, User, Loader2, Trash2, Sparkles,
    Leaf, Cloud, Bug, Droplets
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import './Assistant.css';

const API_URL = 'http://localhost:5000/api/chat';

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
        const currentInput = input.trim();
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: currentInput,
                    history: messages.slice(-6)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Chat API error:', error);
            toast.error('Failed to get response. Please try again.');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again or check if the backend server is running.'
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
