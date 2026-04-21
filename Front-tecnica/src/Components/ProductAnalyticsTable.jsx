import React from 'react';
import '../index.css';

export default function ProductAnalyticsTable({ productData }) {
  const analytics = productData?.metrics ? productData : productData?.data;
  const metrics = analytics?.metrics;
  const summary = analytics?.summary;

  if (!metrics) return <div className="analytics-loading">Cargando analíticas...</div>;

  const getStatusClass = (text) => {
    if (!text) return 'status-neutral';
    const t = text.toLowerCase();
    if (t.includes('crítico') || t.includes('lento') || t.includes('baja') || t.includes('pérdida') || t.includes('siniestralidad')) return 'status-bad';
    if (t.includes('saludable') || t.includes('eficiente') || t.includes('alta') || t.includes('sólida')) return 'status-good';
    return 'status-neutral';
  };

  return (
    <div className="analytics-table-container">
      <h3 className="table-title">📈 Rendimiento de Cartera por Ramo</h3>
      
      {/* TABLA PRINCIPAL */}
      <table className="product-table">
        <thead>
          <tr>
            <th>KPI Estratégico</th>
            <th>Resultado</th>
            <th>Diagnóstico</th>
            <th>Meta</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr key={i}>
              <td className="kpi-name">
                <strong>{m.kpi}</strong>
                <span className="kpi-context-block">{m.contexto}</span>
              </td>
              <td className="valor-destacado">{m.valor}</td>
              <td>
                <span className={`status-pill ${getStatusClass(m.diagnostico)}`}>
                  {m.diagnostico}
                </span>
              </td>
              <td className="meta-cell">{m.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DESGLOSE POR TIPO DE PÓLIZA (RAMO) */}
      {summary?.profitabilityByType && (
        <div className="segments-analysis">
          <h4 className="section-subtitle">📍 Rentabilidad por Segmentos (Loss Ratio)</h4>
          <div className="segments-grid">
            {summary.profitabilityByType.map((type, idx) => (
              <div key={idx} className="segment-card">
                <span className="segment-name">{type.name}</span>
                <span className={`segment-value ${parseFloat(type.ratio) > 80 ? 'text-danger' : 'text-success'}`}>
                  {type.ratio}
                </span>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${Math.min(parseFloat(type.ratio), 100)}%`,
                      backgroundColor: parseFloat(type.ratio) > 80 ? '#ef4444' : '#22c55e'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSIGHT FINAL */}
      {summary && (
        <div className={`insight-card health-${summary.tenant_health.toLowerCase()}`}>
          <h4>💡 Insight de Negocio</h4>
          <p>
            El estado de salud global es <strong>{summary.tenant_health}</strong>. 
            {summary.worst_performing_type && (
              <span> Atención: El ramo <strong>{summary.worst_performing_type.name}</strong> es el menos rentable con un ratio de {summary.worst_performing_type.ratio}.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}