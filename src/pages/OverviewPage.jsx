import { Link } from 'react-router-dom'
import { Badge, Panel } from '../components/ui'

const services = [
    { name: 'Identity', description: 'Tenant, user, role & permission', to: '/identity', metric: 'IAM', tone: 'blue' },
    { name: 'Scheduler', description: 'Tasks, groups & executions', to: '/scheduler', metric: 'CRON', tone: 'green' },
    { name: 'Centralized Alert', description: 'Create & dispatch notification', to: '/alerts', metric: 'SMTP', tone: 'amber' },
    { name: 'Audit Log', description: 'Trace every critical action', to: '/audit', metric: 'EVENTS', tone: 'violet' },
]
export default function OverviewPage() { return <div className="page-stack"><section className="hero"><div><p className="eyebrow">SYSTEM OVERVIEW</p><h2>Good systems feel quiet.</h2><p>Semua layanan operasional Anda, dirangkum dalam satu pandangan.</p></div><div className="hero__status"><span className="system-pulse" />Gateway connected</div></section><div className="service-grid">{services.map((service, index) => <Link className="service-card" to={service.to} key={service.name}><div className={`service-card__icon ${service.tone}`}>{String(index + 1).padStart(2, '0')}</div><Badge tone="success">Ready</Badge><h3>{service.name}</h3><p>{service.description}</p><footer><span>{service.metric}</span><strong>Open →</strong></footer></Link>)}</div><Panel title="Architecture at a glance" eyebrow="REQUEST FLOW"><div className="architecture"><div>Web dashboard<small>React + Vite</small></div><span>→</span><div className="architecture__active">API Gateway<small>Single entry point</small></div><span>→</span><div>Backend services<small>Domain routing</small></div></div></Panel></div> }
