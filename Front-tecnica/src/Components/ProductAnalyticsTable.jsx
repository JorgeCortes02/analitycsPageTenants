import React from 'react';
import '../index.css';

export default function ProductAnalyticsTable({ productData }) {
  if (!productData || !productData.metrics) return null;

  return (
    <div className="analytics-table-container">
        
      <h3 className="table-title">Panel de Control: Rendimiento de Cartera</h3>
      <p>NO DISCRIMINA POR USUARIO</p>
      <table className="product-table">
        <thead>
          <tr>
            <th>Indicador Clave (KPI)</th>
            <th>Resultado</th>
            <th>Diagnóstico de Negocio</th>
            <th>Objetivo</th>
          </tr>
        </thead>
        <tbody>
          {productData.metrics.map((m, i) => (
            <tr key={i}>
              <td style={{ fontWeight: '600' }}>{m.kpi}</td>
              <td className="valor-destacado">{m.valor}</td>
              <td>
                <span className={m.diagnostico.includes('Crítico') ? 'status-bad' : 'status-neutral'}>
                  {m.diagnostico}
                </span>
              </td>
              <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{m.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}