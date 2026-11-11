import '../../css/Messages.css';
import { io } from 'socket.io-client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentContext } from '../../store/authStore';

const API_URL = 'http://localhost:3000';

function MessagesVendeur() {
  const navigate = useNavigate();
  const { idUser, isBoutique } = useMemo(() => getCurrentContext(), []);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const bodyRef = useRef(null);
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);

  const activeConversation = conversations.find((c) => c.id_conversation === activeId) || null;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!socketRef.current) {
      const token = localStorage.getItem('token');
      if (!token) return;

      const socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
      });

      socket.on('connect', () => {
        if (activeIdRef.current) {
          socket.emit('joinConversation', { conversationId: activeIdRef.current }, (response) => {
            if (!response?.success) {
              console.warn('Impossible de rejoindre la conversation Socket.IO :', response?.message);
            }
          });
        }
      });

      socket.on('newMessage', (message) => {
        if (message?.id_conversation === activeIdRef.current) {
          setMessages((current) => [...current, message]);
        } else {
          setConversations((current) =>
            current.map((conv) =>
              conv.id_conversation === message.id_conversation
                ? {
                    ...conv,
                    dernier_message: message.contenu,
                    dernier_message_date: message.date_creation,
                  }
                : conv,
            ),
          );
        }
      });

      socketRef.current = socket;
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (socketRef.current?.connected && activeId) {
      socketRef.current.emit('joinConversation', { conversationId: activeId }, (response) => {
        if (!response?.success) {
          console.warn('Impossible de rejoindre la conversation Socket.IO :', response?.message);
        }
      });
    }
  }, [activeId]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConv(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      setConversations(data);
      if (data.length > 0) setActiveId(data[0].id_conversation);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations :', error);
      setLoadError('Impossible de charger vos conversations pour le moment.');
    } finally {
      setIsLoadingConv(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setIsLoadingMsgs(true);
    try {
      const res = await fetch(`${API_URL}/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data);
      await fetch(`${API_URL}/messages/conversations/${conversationId}/lu`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    } catch (error) {
      console.error('Erreur lors du chargement des messages :', error);
      setMessages([]);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  const handleSendMessage = async () => {
    const contenu = textInput.trim();
    if (!contenu || !activeId) return;
    setIsSending(true);
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          'sendMessage',
          { id_conversation: activeId, contenu, type_message: 'texte' },
          (response) => {
            if (response?.success) {
              setMessages((current) => [...current, response.message]);
              setTextInput('');
            } else {
              console.error('Erreur Socket.IO sendMessage:', response?.message);
            }
          },
        );
      } else {
        const res = await fetch(`${API_URL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ id_conversation: activeId, contenu }),
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const savedMessage = await res.json();
        setMessages((current) => [...current, savedMessage]);
        setTextInput('');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message :', error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.autre_partie_nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="msgr-page">
      <div className="msgr-topline">
        <div>
          <span className="msgr-kicker">Échanges</span>
          <h1>Messages — Espace boutique</h1>
        </div>
      </div>

      {isLoadingConv ? (
        <p className="msgr-loading">Chargement de vos conversations…</p>
      ) : loadError ? (
        <div className="msgr-error">
          <p>{loadError}</p>
          <button className="msgr-retry-btn" onClick={fetchConversations}>
            Réessayer
          </button>
        </div>
      ) : (
        <div className="msgr-layout">
          <div className="msgr-list">
            <div className="msgr-list-search">
              <input
                type="text"
                placeholder="Rechercher une conversation…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {filteredConversations.length === 0 ? (
              <div className="msgr-list-empty">Aucune conversation pour le moment.</div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id_conversation}
                  className={`msgr-conv${conv.id_conversation === activeId ? ' active' : ''}`}
                  onClick={() => setActiveId(conv.id_conversation)}
                >
                  <div
                    className="msgr-conv-avatar"
                    style={conv.autre_partie_avatar ? { backgroundImage: `url(${conv.autre_partie_avatar})` } : undefined}
                  />
                  <div className="msgr-conv-info">
                    <div className="msgr-conv-name">{conv.autre_partie_nom}</div>
                    <div className="msgr-conv-preview">{conv.dernier_message}</div>
                  </div>
                  <div className="msgr-conv-time">{formatRelativeDate(conv.dernier_message_date)}</div>
                  {conv.non_lus > 0 && <div className="msgr-conv-unread">{conv.non_lus}</div>}
                </div>
              ))
            )}
          </div>

          <div className="msgr-thread">
            {!activeConversation ? (
              <div className="msgr-thread-empty">
                <p>Sélectionnez une conversation pour l'afficher.</p>
              </div>
            ) : (
              <>
                <div className="msgr-thread-head">
                  <div
                    className="msgr-thread-avatar"
                    style={activeConversation.autre_partie_avatar ? { backgroundImage: `url(${activeConversation.autre_partie_avatar})` } : undefined}
                  />
                  <div>
                    <div className="msgr-thread-name">{activeConversation.autre_partie_nom}</div>
                    <div className="msgr-thread-status">{activeConversation.en_ligne ? '● En ligne' : 'Hors ligne'}</div>
                  </div>
                </div>

                <div className="msgr-body" ref={bodyRef}>
                  {isLoadingMsgs ? (
                    <p className="msgr-loading">Chargement des messages…</p>
                  ) : messages.length === 0 ? (
                    <div className="msgr-body-empty">Aucun message pour l'instant. Dites bonjour !</div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.id_user === idUser;
                      return (
                        <div key={msg.id_message} className={`msgr-bubble-row ${isMine ? 'me' : 'them'}`}>
                          <div className={`msgr-bubble ${isMine ? 'me' : 'them'}`}>
                            <div className="msgr-bubble-sender">
                              {isMine ? 'Vous' : 'Client'}
                            </div>
                            {msg.contenu && <div className="msgr-bubble-text">{msg.contenu}</div>}
                            {msg.produit && (
                              <button type="button" className="msgr-product-link" onClick={() => navigate(`/produit/${msg.produit.id}`)}>
                                {msg.produit.image_url && <img src={msg.produit.image_url} alt="" />}
                                <span>
                                  <small>Produit concerné</small>
                                  <strong>{msg.produit.nom}</strong>
                                  <em>{Number(msg.produit.prix).toFixed(2)} MAD</em>
                                </span>
                              </button>
                            )}
                            <div className="msgr-bubble-meta">
                              <time className="msgr-bubble-time" dateTime={msg.date_creation}>{formatTime(msg.date_creation)}</time>
                              {isMine && <span className="msgr-bubble-status">{statusIcon(msg.statut_lecture)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="msgr-input-bar">
                  <input
                    type="text"
                    className="msgr-text-input"
                    placeholder="Écrire un message…"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    className="msgr-send-btn"
                    onClick={handleSendMessage}
                    disabled={isSending || !textInput.trim()}
                  >
                    {isSending ? '…' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function formatTime(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDate(isoDate) {
  if (!isoDate) return '';
  const diffDays = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return formatTime(isoDate);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return new Date(isoDate).toLocaleDateString('fr-FR', { weekday: 'short' });
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function statusIcon(statut) {
  if (statut === 'lu') return '✓✓';
  if (statut === 'livre') return '✓✓';
  return '✓';
}

export default MessagesVendeur;
