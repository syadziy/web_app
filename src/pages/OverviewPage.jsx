import { Link } from 'react-router-dom'
import { Badge, MaterialIcon, Panel } from '../components/ui'
import { useAuth } from '../store/AuthContext'
import { ALERT_PERMISSIONS, IDENTITY_PERMISSIONS, PERMISSIONS } from '../store/permissions'
import { useLanguage } from '../store/LanguageContext'

const services = [
    { name: 'Identity', description: 'Tenant, user, role & permission', to: '/identity', metric: 'IAM', tone: 'blue', icon: 'manage_accounts', permissions: IDENTITY_PERMISSIONS },
    { name: 'Scheduler', description: 'Tasks, groups & executions', to: '/scheduler', metric: 'CRON', tone: 'green', icon: 'event_repeat', permissions: [PERMISSIONS.SCHEDULER_READ, PERMISSIONS.SCHEDULER_MANAGE] },
    { name: 'Centralized Alert', description: 'Create & dispatch notification', to: '/alerts', metric: 'SMTP', tone: 'amber', icon: 'notification_important', permissions: ALERT_PERMISSIONS },
    { name: 'Audit Log', description: 'Trace every critical action', to: '/audit', metric: 'EVENTS', tone: 'violet', icon: 'fact_check', permissions: [PERMISSIONS.AUDIT_READ] },
]
export default function OverviewPage() { const { canAny } = useAuth(); const { t } = useLanguage(); const visibleServices = services.filter((service) => canAny(service.permissions)); return <div className="page-stack"><section className="hero"><div><p className="eyebrow">SYSTEM OVERVIEW</p><h2>{t('goodSystems')}</h2><p>{t('overviewIntro')}</p></div><div className="hero__status"><span className="system-pulse" />{t('gatewayConnected')}</div></section><div className="service-grid">{visibleServices.map((service) => <Link className="service-card" to={service.to} key={service.name}><div className={`service-card__icon ${service.tone}`}><MaterialIcon name={service.icon} /></div><Badge tone="success">{t('ready')}</Badge><h3>{service.name}</h3><p>{service.description}</p><footer><span>{service.metric}</span><strong>{t('open')}</strong></footer></Link>)}</div><Panel title={t('architecture')} eyebrow={t('requestFlow')}><div className="architecture"><div>{t('webDashboard')}<small>React + Vite</small></div><MaterialIcon name="arrow_forward" /><div className="architecture__active">API Gateway<small>{t('singleEntry')}</small></div><MaterialIcon name="arrow_forward" /><div>{t('backendServices')}<small>{t('domainRouting')}</small></div></div></Panel></div> }
