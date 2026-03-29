import React from 'react';
import { MESSAGES_PAGE_SIZE } from '@/constants/messages';
import { MessageSquare, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMessagesPage } from '@/hooks';
import { displayPhone, isFromBot } from '@/utils';

const fmt = (value: string) =>
  new Date(value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`).toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

export default function Messages() {
  const {
    messages,
    pageMessages,
    replyingTo,
    replyText,
    setReplyText,
    sending,
    currentPage,
    totalPages,
    setCurrentPage,
    handleSendReply,
    handleReplyStart,
    handleReplyCancel,
  } = useMessagesPage();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mensajes</h1>
          <p className="page-subtitle">Lista de todos los mensajes recibidos.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <MessageSquare size={15} className="card-title-icon" />
            Todos los mensajes
            <span className="count-badge">{messages.length}</span>
          </h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>De</th>
                <th>Mensaje</th>
                <th>Fecha</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(pageMessages) && pageMessages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td-empty">
                    <div className="td-empty-inner">
                      <MessageSquare size={28} className="td-empty-icon" />
                      <p className="td-empty-text">Sin mensajes aun.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                Array.isArray(pageMessages) && pageMessages.map((message) => (
                  <tr key={message.id}>
                    <td className="td-name">
                      {isFromBot(message.from_number) ? <span className="msg-bot-label">Bot</span> : displayPhone(message.from_number)}
                    </td>
                    <td>{message.body}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(message.created_at)}</td>
                    <td>
                      {replyingTo === message.id ? (
                        <div className="reply-form">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Escribir respuesta..."
                            className="reply-input"
                            onKeyDown={(event) => event.key === 'Enter' && handleSendReply(message)}
                          />
                          <button className="btn-send" disabled={sending || !replyText.trim()} onClick={() => handleSendReply(message)}>
                            <Send size={14} />
                          </button>
                          <button className="btn-cancel-link" onClick={handleReplyCancel}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        !isFromBot(message.from_number) && (
                          <button className="btn-reply-link" onClick={() => handleReplyStart(message.id)}>
                            Responder
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <p className="pagination-info">
              Mostrando <strong>{(currentPage - 1) * MESSAGES_PAGE_SIZE + 1}</strong>-
              <strong>{Math.min(currentPage * MESSAGES_PAGE_SIZE, messages.length)}</strong> de <strong>{messages.length}</strong>
            </p>
            <div className="pagination-controls">
              <button className="btn-page" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>
                <ChevronLeft size={15} />
              </button>
              <span className="pagination-label">Pag. {currentPage} / {totalPages}</span>
              <button className="btn-page" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
