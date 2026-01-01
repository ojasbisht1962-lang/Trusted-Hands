import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import './Chat.css';

export default function TaskerChat() {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchChatMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (id) => {
    try {
      const response = await api.get(`/chat/${id}`);
      setSelectedChat(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setSending(true);
      const recipientId = selectedChat.customer_id;
      
      const response = await api.post('/chat/send', {
        recipient_id: recipientId,
        content: newMessage.trim()
      });

      setMessages([...messages, response.data.message]);
      setNewMessage('');
      
      // Update conversation in list
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
  <LoadingScreen message="Firing Up The Engines" />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="chat-page-container">
      {/* Conversations Sidebar */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h2>💬 Messages</h2>
          <p>Chat with your customers</p>
        </div>

        {conversations.length === 0 ? (
          <div className="empty-conversations">
            <div className="empty-icon">💬</div>
            <p>No conversations yet</p>
            <small>Customers will appear here when they message you</small>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map(conv => (
              <div
                key={conv._id}
                className={`conversation-item ${selectedChat?._id === conv._id ? 'active' : ''}`}
                onClick={() => {
                  navigate(`/tasker/chat/${conv._id}`);
                  setSelectedChat(conv);
                  setMessages(conv.messages || []);
                }}
              >
                <div className="conversation-avatar">
                  {conv.other_user?.profile_picture ? (
                    <img src={conv.other_user.profile_picture} alt={conv.other_user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {conv.other_user?.name?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
                <div className="conversation-info">
                  <div className="conversation-top">
                    <h4>{conv.other_user?.name || 'Customer'}</h4>
                    <span className="conversation-time">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="last-message">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <div className="unread-badge">{conv.unread_count}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {!selectedChat ? (
          <div className="no-chat-selected">
            <div className="empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the left to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">
                  {selectedChat.other_user?.profile_picture ? (
                    <img src={selectedChat.other_user.profile_picture} alt={selectedChat.other_user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedChat.other_user?.name?.charAt(0) || 'C'}
                    </div>
                  )}
                </div>
                <div>
                  <h3>{selectedChat.other_user?.name || 'Customer'}</h3>
                  <p>Customer</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="messages-list">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`message ${msg.sender_id === user._id ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form className="message-input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sending}
              />
              <button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? '⏳' : '📤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
}
