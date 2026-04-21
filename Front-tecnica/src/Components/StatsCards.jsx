import React from 'react';
import '../index.css'; // Importante importar el nuevo CSS

export default function StatsCards({ analytics }) {
  if (!analytics || !analytics.metrics) return null;

  const { roleScope, metrics } = analytics;

  return (
    <div className="stats-container">
      <h3 className="stats-title">
        Vista Analítica: <strong>{roleScope}</strong>
      </h3>
      
      <div className="stats-grid">
        
        <div className="stat-card border-blue">
          <h4 className="stat-label">Total Primas (Ingreso)</h4>
          <p className="stat-value">{metrics.totalPremium}€</p>
        </div>

        <div className="stat-card border-red">
          <h4 className="stat-label">Coste Siniestros (Gasto)</h4>
          <p className="stat-value">{metrics.totalClaimsCost}€</p>
        </div>

        <div className="stat-card border-green">
          <h4 className="stat-label">Pólizas Activas</h4>
          <p className="stat-value">{metrics.activePoliciesCount}</p>
        </div>

        <div className="stat-card border-orange">
          <h4 className="stat-label">Siniestros Abiertos</h4>
          <p className="stat-value">{metrics.openClaimsCount}</p>
        </div>

      </div>
    </div>
  );
}