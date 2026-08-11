import { useState } from 'react'
import { useLanguage } from '../store/LanguageContext'

export function Button({ variant = 'primary', className = '', ...props }) { return <button className={`button button--${variant} ${className}`} {...props} /> }
export function Field({ label, hint, error, as = 'input', options = [], ...props }) {
  const id = props.id || props.name
  const Element = as
  return <label className="field" htmlFor={id}><span>{label}</span>{as === 'select' ? <select id={id} {...props}>{options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select> : <Element id={id} {...props} />}{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</label>
}
export function Panel({ title, eyebrow, actions, children, className = '' }) { return <section className={`panel ${className}`}><header className="panel__header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{actions}</header>{children}</section> }
export function Badge({ tone = 'neutral', children }) { return <span className={`badge badge--${tone}`}>{children}</span> }
export function Status({ loading, error, empty, onRetry }) {
  const { t } = useLanguage()
  if (loading) return <div className="status"><span className="spinner" />{t('loading')}</div>
  if (error) return <div className="status status--error"><span>{error}</span>{onRetry && <Button variant="ghost" onClick={onRetry}>{t('retry')}</Button>}</div>
  if (empty) return <div className="status">{t('empty')}</div>
  return null
}
export function DataTable({ columns, rows, rowKey = 'id', pagination }) {
  const { t } = useLanguage()
  const fallback = { limit: rows.length || 10, offset: 0, total: rows.length, options: [10, 50, 100, 500], onChange: () => {} }
  const { limit, offset, total, options = [10, 50, 100, 500], onChange } = pagination || fallback
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return <div className="data-table">
    <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[rowKey] || offset + index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
    <footer className="table-pagination"><span>{t('showing')} {rows.length ? offset + 1 : 0}–{Math.min(offset + rows.length, total)} {t('of')} {total}</span><label>{t('rowsPerPage')} <select aria-label={t('rowsPerPage')} value={limit} onChange={(event) => onChange({ limit: Number(event.target.value), offset: 0 })}>{options.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div><Button variant="ghost" disabled={offset === 0} onClick={() => onChange({ limit, offset: Math.max(0, offset - limit) })}>← {t('previous')}</Button><span>{t('page')} {currentPage} / {totalPages}</span><Button variant="ghost" disabled={offset + rows.length >= total} onClick={() => onChange({ limit, offset: offset + limit })}>{t('next')} →</Button></div></footer>
  </div>
}
export function Modal({ title, open, onClose, children }) {
  const { t } = useLanguage()
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><Button variant="ghost" onClick={onClose} aria-label={t('closeDialog')}>×</Button></header>{children}</section></div>
}
export function useNotice() { const [notice, setNotice] = useState(null); return { notice, success: (message) => setNotice({ tone: 'success', message }), fail: (message) => setNotice({ tone: 'error', message }), clear: () => setNotice(null) } }
export function Notice({ notice, onClose }) { const { t } = useLanguage(); return notice && <div className={`notice notice--${notice.tone}`} role="status"><span>{notice.message}</span><button onClick={onClose} aria-label={t('closeNotification')}>×</button></div> }
