import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Zap,
    BarChart3,
    Shield,
    ArrowRight,
    Scan,
    PieChart,
    Users,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const LandingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="landing-container" style={{
            minHeight: '100vh',
            background: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={logo} alt="ReportPilot" style={{ height: '40px' }} />
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Features</a>
                    <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</a>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-secondary"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '0.5rem 1.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Log In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                textAlign: 'center',
                padding: '6rem 1rem 4rem',
                maxWidth: '900px',
                margin: '0 auto'
            }}>

                <h1 style={{
                    fontSize: ' clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(to right, #fff 30%, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Automatización de Gastos para Empresas de Turismo
                </h1>
                <p style={{
                    fontSize: '1.2rem',
                    color: '#94a3b8',
                    maxWidth: '650px',
                    margin: '0 auto 2.5rem',
                    lineHeight: '1.6'
                }}>
                    Deja de perseguir recibos físicos. Nuestra tecnología extrae datos al instante, genera auditorías visuales y prepara reportes contables en segundos.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            padding: '1rem 2rem',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 10px 15px -3px rgba(3, 105, 161, 0.3)'
                        }}
                    >
                        Empezar Ahora <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* Mock Dashboard Preview */}
            <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }}>
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    padding: '1rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '500px',
                        background: 'var(--gradient-surface)',
                        borderRadius: '16px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#475569'
                    }}>
                        {/* Abstract Dashboard Visual */}
                        <div style={{ textAlign: 'center' }}>
                            <BarChart3 size={100} strokeWidth={1} />
                            <p>Dashboard de Auditoría Inteligente</p>
                        </div>
                        {/* Float Elements */}
                        <div style={{
                            position: 'absolute', top: '10%', right: '5%',
                            background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px',
                            backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '1.2rem' }}>$4,250.00</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Gastos Auditados</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" style={{ padding: '8rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>Todo lo que necesitas para tu contabilidad</h2>
                    <p style={{ color: '#94a3b8' }}>Elimina el trabajo manual y escala tu operación turística.</p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    <FeatureCard
                        icon={<Scan size={24} color="#38bdf8" />}
                        title="Extracción Automática"
                        desc="Sube una foto y deja que nuestra tecnología extraiga proveedor, monto, fecha y categoría automáticamente."
                    />
                    <FeatureCard
                        icon={<Shield size={24} color="#22c55e" />}
                        title="Verificación Cara a Cara"
                        desc="Compara la foto del recibo con los datos extraídos cara a cara para una auditoría perfecta."
                    />
                    <FeatureCard
                        icon={<PieChart size={24} color="#f59e0b" />}
                        title="Panel de Control"
                        desc="Visualiza tendencias de gasto, costos por tour y desempeño de guías en tiempo real."
                    />
                    <FeatureCard
                        icon={<Users size={24} color="#818cf8" />}
                        title="Gestión de Equipo"
                        desc="Gestiona toda tu organización y delega acceso a tus guías de forma segura."
                    />
                    <FeatureCard
                        icon={<Zap size={24} color="#ec4899" />}
                        title="Exportación a Excel"
                        desc="Genera sábanas de datos formateadas para tu contador en un solo clic."
                    />
                    <FeatureCard
                        icon={<MessageSquare size={24} color="#10b981" />}
                        title="Reporte Móvil"
                        desc="Optimizado para que tus guías reporten desde cualquier lugar, incluso sin PC."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <img src={logo} alt="ReportPilot" style={{ height: '30px', opacity: 0.5 }} />
                </div>
                <p style={{ color: '#475569', fontSize: '0.9rem' }}>© 2025 ReportPilot. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div style={{
        padding: '2rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.3s ease',
        cursor: 'default'
    }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <div style={{ marginBottom: '1.5rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6' }}>{desc}</p>
    </div>
);

const PricingCard = ({ title, price, features, btnText, active }) => (
    <div style={{
        padding: '3rem 2rem',
        background: active ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.01)',
        borderRadius: '24px',
        border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
    }}>
        {active && <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#38bdf8', color: '#0f172a', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>POPULAR</div>}
        <h3 style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: '1rem' }}>{title}</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem' }}>{price}</div>
        <div style={{ flex: 1, marginBottom: '2rem' }}>
            {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontSize: '0.95rem', color: '#cbd5e1' }}>
                    <CheckCircle size={16} color="#38bdf8" /> {f}
                </div>
            ))}
        </div>
        <button style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: 'none',
            background: active ? '#38bdf8' : 'rgba(255,255,255,0.05)',
            color: active ? '#0f172a' : 'white',
            fontWeight: '700',
            cursor: 'pointer'
        }}>
            {btnText}
        </button>
    </div>
);

export default LandingPage;
