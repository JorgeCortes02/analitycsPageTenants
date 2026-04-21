import React, { useState, useEffect } from 'react';

import UserSelector from './components/UserSelector';
import ClientTable from './components/ClientTable';
import RiskPanel from './components/RiskPanel';
import StatsCards from './components/StatsCards'; // <-- 1. Importamos el componente
import ProductAnalyticsTable from './Components/ProductAnalyticsTable';

function App() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [risks, setRisks] = useState([]);
  const [analytics, setAnalytics] = useState(null); // <-- 2. Nuevo estado para analytics

const [productAnalytics, setProductAnalytics] = useState(null);
  useEffect(() => {
    if (!user) return;

    const headers = { 'x-user-id': user.user_id };

   Promise.all([
      fetch('http://localhost:3001/api/clients', { headers }).then(res => res.json()),
      fetch('http://localhost:3001/api/risk', { headers }).then(res => res.json()),
      fetch('http://localhost:3001/api/analytics', { headers }).then(res => res.json()),
      // --- NUEVO ENDPOINT PARA LA OPCIÓN B ---
      fetch('http://localhost:3001/api/analytics/product', { headers }).then(res => res.json())
    ])
    .then(([clientsData, risksData, analyticsData, productData]) => {
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setRisks(Array.isArray(risksData) ? risksData : []);
      setAnalytics(analyticsData);
      
      // Seteamos el nuevo estado para la tabla de producto
      // Asumiendo que definiste: const [productAnalytics, setProductAnalytics] = useState(null);
      setProductAnalytics(productData.success ? productData.data : null);
    })
    .catch(err => console.error("Error cargando datos:", err));
  }, [user]);

  return (
    <div className="container">
      <header className="header">
        <h2>Broker Analytics Dashboard</h2>
        <UserSelector onSelect={setUser} />
      </header>

      {user ? (
        <>
          {/* 5. Colocamos las tarjetas de analítica arriba del todo */}
          <StatsCards analytics={analytics} />

          <div className="grid">
            <div className="card">
              <h3>Clientes ({user.role}) - {user.tenant_id}</h3>
              <ClientTable clients={clients} />
              <ProductAnalyticsTable productData={productAnalytics}/>
            </div>
            <div className="card">
              <h3>Alertas de Riesgo</h3>
              <RiskPanel risks={risks} />
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          Selecciona un usuario para empezar
        </div>
      )}
    </div>
  );
}

export default App;
