import "../../css/Messages.css";
import { io } from "socket.io-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentContext } from "../../store/authStore";

const API_URL = "http://localhost:3000";

/* =========================================================
   Contexte : une seule page pour utilisateur et boutique.
   - Si le token contient id_boutique → on travaille côté boutique
     (les conversations affichées sont celles reçues par la boutique).
   - Sinon → on travaille côté utilisateur (id_user du token),
     conversations avec les boutiques contactées.
   Le backend doit appliquer la même logique de son côté :
   déduire le scope depuis le token plutôt que depuis un paramètre
   envoyé par le frontend (plus sûr).
   ========================================================= */

/* =========================================================
   Structures attendues (basées sur les tables fournies) :

   Conversation (GET /messages/conversations) :
   {
     id_conversation,
     autre_partie_nom,       // nom du client ou de la boutique en face
     autre_partie_avatar,    // url ou null
     dernier_message,
     dernier_message_date,
     non_lus,                // nombre de messages non lus
     en_ligne                // présence, optionnel (TODO si WebSocket branché plus tard)
   }

   Message (GET /messages/conversations/:id) — mappe directement
   la table `messages` :
   {
     id_message, id_conversation, id_user, id_produit,
     contenu, type_message, date_creation, date_maj,
     pieces_jointes: [                     // table messages_pieces_jointes
       { id_piece_jointe, url_fichier, nom_fichier, type_fichier, taille_fichier }
     ],
     statut_lecture: "envoye" | "livre" | "lu"   // agrégé côté backend depuis messages_statuts
   }
   ========================================================= */

const MAX_FILE_SIZE_MB = 25;
const ACCEPTED_TYPES = "image/*,video/*";

function Messagerie() {
  const { idUser, isBoutique } = useMemo(() => getCurrentContext(), []);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const [isLoadingConv, setIsLoadingConv] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [authError, setAuthError] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedConversationId = Number(searchParams.get("conversation")) || null;

  const [textInput, setTextInput] = useState("");
  const [stagedFiles, setStagedFiles] = useState([]); // [{ file, previewUrl, type }]
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const bodyRef = useRef(null);
  const socketRef = useRef(null);
  const activeIdRef = useRef(activeId);

  const activeConversation =
    conversations.find((c) => c.id_conversation === activeId) || null;

  /* =========================================================
     Chargement des conversations au montage
     ========================================================= */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthError("Vous devez être connecté pour accéder aux messages.");
      setIsLoadingConv(false);
      return;
    }

    setAuthError(null);
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeId) fetchMessages(activeId);
  }, [activeId]);

  const joinConversationRoom = (conversationId) => {
    if (!conversationId || !socketRef.current?.connected) return;

    socketRef.current.emit(
      "joinConversation",
      { conversationId },
      (response) => {
        if (!response?.success) {
          console.warn(
            "Impossible de rejoindre la conversation Socket.IO :",
            response?.message,
          );
        }
      },
    );
  };

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!socketRef.current) {
      const token = localStorage.getItem("token");
      if (!token) return;

      const socket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        if (activeIdRef.current) {
          joinConversationRoom(activeIdRef.current);
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error);
      });

      socket.on("newMessage", (message) => {
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
    joinConversationRoom(activeId);
  }, [activeId]);

  useEffect(() => {
    // scroll automatique vers le bas à chaque nouveau message
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConv(true);
    setLoadError(null);
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Non autorisé. Veuillez vous reconnecter.");
        }
        throw new Error(`Erreur HTTP ${res.status}`);
      }
      const data = await res.json();
      setConversations(data || []);
      if (Array.isArray(data) && data.length > 0) {
        const targetId =
          requestedConversationId &&
          data.some((conv) => conv.id_conversation === requestedConversationId)
            ? requestedConversationId
            : data[0].id_conversation;
        setActiveId(targetId);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des conversations :", error);
      setLoadError(error?.message || "Impossible de charger vos conversations pour le moment.");
    } finally {
      setIsLoadingConv(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setIsLoadingMsgs(true);
    try {
      const res = await fetch(
        `${API_URL}/messages/conversations/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data || []);

      await fetch(`${API_URL}/messages/conversations/${conversationId}/lu`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (error) {
      console.error("Erreur lors du chargement des messages :", error);
      setMessages([]);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  /* =========================================================
     Pièces jointes — sélection façon WhatsApp
     ========================================================= */

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((file) => {
      const isImageOrVideo =
        file.type.startsWith("image/") || file.type.startsWith("video/");
      const isWithinSize = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      if (!isImageOrVideo)
        console.warn(
          `${file.name} ignoré : seuls images et vidéos sont acceptées.`,
        );
      if (!isWithinSize)
        console.warn(`${file.name} ignoré : dépasse ${MAX_FILE_SIZE_MB} Mo.`);
      return isImageOrVideo && isWithinSize;
    });

    const staged = valid.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    setStagedFiles((current) => [...current, ...staged]);
    e.target.value = ""; // permet de re-sélectionner le même fichier plus tard
  };

  const handleRemoveStagedFile = (index) => {
    setStagedFiles((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  /* =========================================================
     Envoi du message (texte + pièces jointes)
     ========================================================= */

  // TODO: POST /messages — envoyer en multipart/form-data si stagedFiles non vide
  const handleSendMessage = async () => {
    const contenu = textInput.trim();
    if (!contenu && stagedFiles.length === 0) return;
    if (!activeId) return;

    setIsSending(true);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "sendMessage",
          { id_conversation: activeId, contenu, type_message: "texte" },
          (response) => {
            if (response?.success) {
              setMessages((current) => [...current, response.message]);
              setTextInput("");
              setStagedFiles([]);
            } else {
              console.error("Erreur Socket.IO sendMessage:", response?.message);
            }
          },
        );
      } else {
        const res = await fetch(`${API_URL}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ id_conversation: activeId, contenu }),
        });
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        const savedMessage = await res.json();
        setMessages((current) => [...current, savedMessage]);
        setTextInput("");
        setStagedFiles([]);
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* =========================================================
     Rendu
     ========================================================= */

  const filteredConversations = conversations.filter((c) =>
    c.autre_partie_nom?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <main className="msgr-page">
      <div className="msgr-topline">
        <div>
          <span className="msgr-kicker">Échanges</span>
          <h1>Messages{isBoutique ? " — Espace boutique" : ""}</h1>
        </div>
      </div>

      {isLoadingConv ? (
        <p className="msgr-loading">Chargement de vos conversations…</p>
      ) : authError ? (
        <div className="msgr-error">
          <p>{authError}</p>
          <button className="msgr-retry-btn" onClick={() => navigate('/login')}>
            Se connecter
          </button>
        </div>
      ) : loadError ? (
        <div className="msgr-error">
          <p>{loadError}</p>
          <button className="msgr-retry-btn" onClick={fetchConversations}>
            Réessayer
          </button>
        </div>
      ) : (
        <div className="msgr-layout">
          {/* ---------- Liste des conversations ---------- */}
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
              <div className="msgr-list-empty">
                Aucune conversation pour le moment.
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id_conversation}
                  className={`msgr-conv${conv.id_conversation === activeId ? " active" : ""}`}
                  onClick={() => setActiveId(conv.id_conversation)}
                >
                  <div
                    className="msgr-conv-avatar"
                    style={
                      conv.autre_partie_avatar
                        ? {
                            backgroundImage: `url(${conv.autre_partie_avatar})`,
                          }
                        : undefined
                    }
                  />
                  <div className="msgr-conv-info">
                    <div className="msgr-conv-name">
                      {conv.autre_partie_nom}
                    </div>
                    <div className="msgr-conv-preview">
                      {conv.dernier_message}
                    </div>
                  </div>
                  <div className="msgr-conv-time">
                    {formatRelativeDate(conv.dernier_message_date)}
                  </div>
                  {conv.non_lus > 0 && (
                    <div className="msgr-conv-unread">{conv.non_lus}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ---------- Fil de discussion ---------- */}
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
                    style={
                      activeConversation.autre_partie_avatar
                        ? {
                            backgroundImage: `url(${activeConversation.autre_partie_avatar})`,
                          }
                        : undefined
                    }
                  />
                  <div>
                    <div className="msgr-thread-name">
                      {activeConversation.autre_partie_nom}
                    </div>
                    {/* TODO: connecter à la présence réelle (WebSocket) une fois disponible */}
                    <div className="msgr-thread-status">
                      {activeConversation.en_ligne
                        ? "● En ligne"
                        : "Hors ligne"}
                    </div>
                  </div>
                </div>

                <div className="msgr-body" ref={bodyRef}>
                  {isLoadingMsgs ? (
                    <p className="msgr-loading">Chargement des messages…</p>
                  ) : messages.length === 0 ? (
                    <div className="msgr-body-empty">
                      Aucun message pour l'instant. Dites bonjour !
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.id_user === idUser;
                      return (
                        <div
                          key={msg.id_message}
                          className={`msgr-bubble-row ${isMine ? "me" : "them"}`}
                        >
                          <div className={`msgr-bubble ${isMine ? "me" : "them"}`}>
                            <div className="msgr-bubble-sender">
                              {isMine ? "Vous" : isBoutique ? "Client" : "Boutique"}
                            </div>
                            {msg.pieces_jointes?.length > 0 && (
                              <div className="msgr-attachments">
                                {msg.pieces_jointes.map((piece) =>
                                  piece.type_fichier?.startsWith("video/") ? (
                                    <video
                                      key={piece.id_piece_jointe}
                                      src={piece.url_fichier}
                                      controls
                                      className="msgr-attachment-video"
                                    />
                                  ) : (
                                    <img
                                      key={piece.id_piece_jointe}
                                      src={piece.url_fichier}
                                      alt={piece.nom_fichier}
                                      className="msgr-attachment-image"
                                    />
                                  ),
                                )}
                              </div>
                            )}

                            {msg.contenu && (
                              <div className="msgr-bubble-text">
                                {msg.contenu}
                              </div>
                            )}

                            {msg.produit && (
                              <button
                                type="button"
                                className="msgr-product-link"
                                onClick={() => navigate(`/produit/${msg.produit.id}`)}
                              >
                                {msg.produit.image_url && <img src={msg.produit.image_url} alt="" />}
                                <span>
                                  <small>Produit concerné</small>
                                  <strong>{msg.produit.nom}</strong>
                                  <em>{Number(msg.produit.prix).toFixed(2)} MAD</em>
                                </span>
                              </button>
                            )}

                            <div className="msgr-bubble-meta">
                              <time
                                className="msgr-bubble-time"
                                dateTime={msg.date_creation}
                              >
                                {formatTime(msg.date_creation)}
                              </time>
                              {isMine && (
                                <span className="msgr-bubble-status">
                                  {statusIcon(msg.statut_lecture)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {stagedFiles.length > 0 && (
                  <div className="msgr-staged-files">
                    {stagedFiles.map((f, index) => (
                      <div className="msgr-staged-item" key={f.previewUrl}>
                        {f.type === "video" ? (
                          <video
                            src={f.previewUrl}
                            className="msgr-staged-preview"
                          />
                        ) : (
                          <img
                            src={f.previewUrl}
                            alt={f.file.name}
                            className="msgr-staged-preview"
                          />
                        )}
                        <button
                          className="msgr-staged-remove"
                          onClick={() => handleRemoveStagedFile(index)}
                          aria-label={`Retirer ${f.file.name}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="msgr-input-bar">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    hidden
                    onChange={handleFileSelect}
                  />
                  <button
                    className="msgr-attach-btn"
                    onClick={handleAttachClick}
                    aria-label="Joindre une image ou une vidéo"
                    title="Joindre une image ou une vidéo"
                  >
                    <svg viewBox="0 0 24 24" className="msgr-icn">
                      <path d="M21 12.5V7a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v11a4 4 0 0 0 4 4h6" />
                      <path d="M15 13a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3" />
                      <circle cx="17.5" cy="17.5" r="3.5" />
                      <path d="M17.5 16v3M16 17.5h3" />
                    </svg>
                  </button>

                  <input
                    type="text"
                    className="msgr-text-input"
                    placeholder="Écrire un message…"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                  />

                  <button
                    className="msgr-send-btn"
                    onClick={handleSendMessage}
                    disabled={
                      isSending ||
                      (!textInput.trim() && stagedFiles.length === 0)
                    }
                  >
                    {isSending ? "…" : "Envoyer"}
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

/* =========================================================
   Aides d'affichage
   ========================================================= */

function formatTime(isoDate) {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeDate(isoDate) {
  if (!isoDate) return "";
  const diffDays = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return formatTime(isoDate);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7)
    return new Date(isoDate).toLocaleDateString("fr-FR", { weekday: "short" });
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function statusIcon(statut) {
  if (statut === "lu") return "✓✓";
  if (statut === "livre") return "✓✓";
  return "✓";
}

export default Messagerie;
