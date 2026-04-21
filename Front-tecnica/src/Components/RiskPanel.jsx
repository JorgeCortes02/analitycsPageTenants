import React from 'react';
import '../index.css'; 

export default function RiskPanel({ risks }) {
  if (!risks || risks.length === 0) {
    return <p className="no-risks">✅ No hay alertas críticas para este perfil.</p>;
  }

  return (
    <div className="risk-container">
      {risks.map((r, index) => {
        // MUY IMPORTANTE: Verifica que riskLevel llegue como "HIGH" o "CRITICAL"
        const { clientName, riskLevel, totalPremium, totalClaimed, reasons } = r;
        
        return (
          <div key={index} className={`risk-card ${riskLevel}`}>
            <div className="risk-header">
              <strong className="risk-name">{clientName}</strong>
              <span className={`risk-badge ${riskLevel}`}>
                {riskLevel}
              </span>
            </div>
          
            <div className="risk-stats">
              <p>🏠 <strong>Ingreso:</strong> {totalPremium}€</p>
              <p>📉 <strong>Gasto:</strong> {totalClaimed}€</p>
            </div>

            <div className="risk-reasons">
              {reasons?.map((msg, i) => (
                <small key={i} className="reason-tag">⚠️ {msg}</small>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}