import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../store/LanguageContext'

export function MaterialIcon({ name, className = '' }) { return <span className={`material-icons ${className}`} aria-hidden="true">{name}</span> }
export function Button({ variant = 'primary', className = '', ...props }) { return <button className={`button button--${variant} ${className}`} {...props} /> }

export function SearchableSelect({ id, name, value, options, onChange, disabled, required, labelId }) {
  const { t } = useLanguage()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedOptions = options.map((option) => ({
    value: String(option.value ?? option),
    label: String(option.label ?? option),
  }))
  const selected = normalizedOptions.find((option) => option.value === String(value ?? ''))
  const visibleOptions = normalizedOptions.filter((option) => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const escape = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [open])

  const select = (nextValue) => {
    onChange?.({ target: { name, value: nextValue } })
    setQuery('')
    setOpen(false)
  }

  return <div className="searchable-select" ref={rootRef}>
    <input type="hidden" name={name} value={value ?? ''} required={required} />
    <button id={id} className="searchable-select__trigger" type="button" role="combobox" aria-labelledby={labelId} aria-expanded={open} aria-controls={`${id}-options`} disabled={disabled} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.label || t('selectOption')}</span><MaterialIcon name="expand_more" />
    </button>
    {open && <div className="searchable-select__panel" id={`${id}-options`} role="listbox">
      <div className="searchable-select__search"><MaterialIcon name="search" /><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchOptions')} aria-label={t('searchOptions')} /></div>
      <div className="searchable-select__options">{visibleOptions.length ? visibleOptions.map((option) => <button type="button" role="option" aria-selected={option.value === String(value ?? '')} key={option.value} onClick={() => select(option.value)}>{option.label}{option.value === String(value ?? '') && <MaterialIcon name="check" />}</button>) : <small>{t('noMatchingOptions')}</small>}</div>
    </div>}
  </div>
}

export function MultiSelect({ label, options, selected, onChange, emptyText, selectText, searchText, noMatchesText }) {
  const labelId = useId()
  const [query, setQuery] = useState('')
  const toggle = (value, checked) => onChange(checked ? [...selected, value] : selected.filter((item) => item !== value))
  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label)
  const visibleOptions = options.filter((option) => `${option.label} ${option.description || ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  return <div className="field multi-select-field"><span id={labelId}>{label}</span><details className="multi-select">
    <summary aria-labelledby={labelId}>{selectedLabels.length ? selectedLabels.join(', ') : selectText}</summary>
    <div className="multi-select__menu">
      {options.length > 0 && <div className="multi-select__search"><MaterialIcon name="search" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchText} aria-label={searchText} /></div>}
      {visibleOptions.map((option) => <label key={option.value}>
        <input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => toggle(option.value, event.target.checked)} />
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
      </label>)}
      {!options.length && <small>{emptyText}</small>}
      {options.length > 0 && !visibleOptions.length && <small>{noMatchesText}</small>}
    </div>
  </details></div>
}

export function Field({ label, hint, error, as = 'input', options = [], ...props }) {
  const id = props.id || props.name
  const Element = as
  if (as === 'select') return <div className="field"><span id={`${id}-label`}>{label}</span><SearchableSelect id={id} options={options} labelId={`${id}-label`} {...props} />{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</div>
  return <label className="field" htmlFor={id}><span>{label}</span><Element id={id} {...props} />{hint && <small>{hint}</small>}{error && <small className="field__error">{error}</small>}</label>
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
    <div className="table-wrap" role="region" aria-label={t('scrollableTable')} tabIndex={0}><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row[rowKey] || offset + index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
    <footer className="table-pagination"><span>{t('showing')} {rows.length ? offset + 1 : 0}–{Math.min(offset + rows.length, total)} {t('of')} {total}</span><label>{t('rowsPerPage')} <select aria-label={t('rowsPerPage')} value={limit} onChange={(event) => onChange({ limit: Number(event.target.value), offset: 0 })}>{options.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div><Button variant="ghost" disabled={offset === 0} onClick={() => onChange({ limit, offset: Math.max(0, offset - limit) })}><MaterialIcon name="chevron_left" />{t('previous')}</Button><span>{t('page')} {currentPage} / {totalPages}</span><Button variant="ghost" disabled={offset + rows.length >= total} onClick={() => onChange({ limit, offset: offset + limit })}>{t('next')}<MaterialIcon name="chevron_right" /></Button></div></footer>
  </div>
}
export function Modal({ title, open, onClose, children }) {
  const { t } = useLanguage()
  if (!open) return null
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><Button variant="ghost" onClick={onClose} aria-label={t('closeDialog')}><MaterialIcon name="close" /></Button></header>{children}</section></div>
}
export function useNotice() { const [notice, setNotice] = useState(null); return { notice, success: (message) => setNotice({ tone: 'success', message }), fail: (message) => setNotice({ tone: 'error', message }), clear: () => setNotice(null) } }
export function Notice({ notice, onClose }) { const { t } = useLanguage(); return notice && <div className={`notice notice--${notice.tone}`} role="status"><span>{notice.message}</span><button onClick={onClose} aria-label={t('closeNotification')}><MaterialIcon name="close" /></button></div> }
