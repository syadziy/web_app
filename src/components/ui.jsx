import { useEffect, useState } from 'react'

export function Button({ variant = 'primary', className = '', ...props }) { return <button className={`button button--${variant} ${className}`} {...props} /> }
export function Field({ label, hint, error, as = 'input', options = [], ...props }) {
  const id = props.id || props.name
  const Element = as
  return <label className="field" htmlFor={id}><span>{label}</span>{as === 'select' ? <select id={id} {...props}>{options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select> : <Element id={id} {...props} />}{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</label>
}
export function Panel({ title, eyebrow, actions, children, className = '' }) { return <section className={`panel ${className}`}><header className="panel__header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{actions}</header>{children}</section> }
export function Badge({ tone = 'neutral', children }) { return <span className={`badge badge--${tone}`}>{children}</span> }
export function Status({ loading, error, empty, onRetry }) {
  if (loading) return <div className="status"><span className="spinner" />Mengambil data…</div>
  if (error) return <div className="status status--error"><span>{error}</span>{onRetry && <Button variant="ghost" onClick={onRetry}>Coba lagi</Button>}</div>
  if (empty) return <div className="status">Belum ada data untuk ditampilkan.</div>
  return null
}
export function DataTable({ columns, rows, rowKey = 'id', defaultPageSize = 10, pageSizeOptions = [10, 50, 100, 500] }) {
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visibleRows = rows.slice(start, start + pageSize)
  useEffect(() => { setPage(1) }, [rows, pageSize])
  return <div className="data-table">
    <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={row[rowKey] || start + index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
    <footer className="table-pagination"><span>Menampilkan {rows.length ? start + 1 : 0}–{Math.min(start + pageSize, rows.length)} dari {rows.length}</span><label>Baris per halaman <select aria-label="Baris per halaman" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div><Button variant="ghost" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Sebelumnya</Button><span>Halaman {currentPage} / {totalPages}</span><Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Berikutnya →</Button></div></footer>
  </div>
}
export function Modal({ title, open, onClose, children }) {
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><Button variant="ghost" onClick={onClose} aria-label="Tutup dialog">×</Button></header>{children}</section></div>
}
export function useNotice() { const [notice, setNotice] = useState(null); return { notice, success: (message) => setNotice({ tone: 'success', message }), fail: (message) => setNotice({ tone: 'error', message }), clear: () => setNotice(null) } }
export function Notice({ notice, onClose }) { return notice && <div className={`notice notice--${notice.tone}`} role="status"><span>{notice.message}</span><button onClick={onClose} aria-label="Tutup notifikasi">×</button></div> }
