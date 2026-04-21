
// --- ACCESO A CLIENTES ---
const getVisibleClients = (user, allClients) => {
  let tenantData = allClients.filter((c) => c.tenant_id === user.tenant_id);

  if (user.role === "admin" || user.role === "manager") {
    // Ambos ven todos los clientes del tenant
    if (user.role === "manager") {
      return tenantData.map((c) => ({
        ...c,
        email: c.sensitive_score < 30 ? "masked@confidential.com" : c.email,
        phone: c.sensitive_score < 30 ? "********" : c.phone,
      }));
    }
    return tenantData;
  }

  if (user.role === "agent") {
    // El agente solo ve su cartera
    return tenantData.filter((c) => c.assigned_user_id === user.user_id);
  }
};

/**
 * Filtra pólizas y siniestros basándose en la visibilidad del cliente.
 * Esto asegura que un Agente no vea pólizas de clientes que no son suyos.
 */
const getVisibleRelatedData = (user, dataArray, visibleClientIds) => {
  // Solo devolvemos datos que pertenezcan a los clientes que el usuario ya puede ver
  return dataArray.filter(
    (item) =>
      item.tenant_id === user.tenant_id &&
      visibleClientIds.includes(item.client_id),
  );
};

const getTenantAnalytics = (user, visiblePolicies, visibleClaims) => {
  const activePolicies = visiblePolicies.filter((p) => p.status === "active");

  return {
    roleScope: user.role === "agent" ? "Personal Portfolio" : "Global Tenant",
    metrics: {
      // Dentro de logic.js, cambia las sumas por esto:
      totalPremium: activePolicies.reduce(
        (acc, p) => acc + (Number(p.annual_premium) || 0),
        0,
      ),
      totalClaimsCost: visibleClaims.reduce(
        (acc, c) => acc + (Number(c.amount) || 0),
        0,
      ),

      activePoliciesCount: activePolicies.length,

      openClaimsCount: visibleClaims.filter((c) => c.status === "open").length,
    },
  };
};



const getHighRiskElements = (
  user,
  visibleClients,
  allPolicies = [],
  allClaims = []
) => {
  if (!visibleClients || visibleClients.length === 0) return [];

  return visibleClients
    .map((client) => {
      const clientClaims = (allClaims || []).filter(c => c.client_id === client.client_id);
      const totalClaimed = clientClaims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

      const clientPolicies = (allPolicies || []).filter(p => p.client_id === client.client_id);
      const totalPremium = clientPolicies.reduce((acc, p) => acc + (Number(p.annual_premium) || 0), 0);

      let riskLevel = "STABLE";
      let reasons = [];

      // --- PRIORIDAD 1: CRITICAL (Rojo) ---
      // Caso A: Gasto mayor que ingreso
      if (totalClaimed > totalPremium && totalClaimed > 0) {
        riskLevel = "CRITICAL";
        reasons.push("Gasto mayor que Ingreso");
      } 
      // Caso B: Score de sensibilidad muy alto (Peligro de fraude/seguridad)
      else if (Number(client.sensitive_score) > 90) { 
        riskLevel = "CRITICAL";
        reasons.push("Perfil de Seguridad Crítico");
      }

      // --- PRIORIDAD 2: HIGH (Amarillo) ---
      // Caso C: Siniestralidad entre el 75% y el 100%
      else if (totalClaimed >= (totalPremium * 0.75)) {
        riskLevel = "HIGH";
        reasons.push("Siniestralidad elevada (>75%)");
      }
      
      // Caso D: Score de sensibilidad medio-alto
      else if (Number(client.sensitive_score) > 70) {
        riskLevel = "HIGH";
        reasons.push("Atención: Score de sensibilidad elevado");
      }

      return {
        clientName: client.full_name,
        riskLevel,
        reasons,
        totalClaimed,
        totalPremium,
      };
    })
    .filter((r) => r.riskLevel !== "STABLE"); 
};

const getProductAnalytics = (tenantPolicies, tenantClaims, tenantClients) => {
  const activePolicies = tenantPolicies.filter(p => p.status === 'active');
  const totalPremium = activePolicies.reduce((acc, p) => acc + (Number(p.annual_premium) || 0), 0);
  const totalClaims = tenantClaims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Cálculos de KPIs
  const lossRatio = totalPremium > 0 ? (totalClaims / totalPremium) * 100 : 0;
  const avgTicket = activePolicies.length > 0 ? (totalPremium / activePolicies.length) : 0;

  return {
    metrics: [
      {
        kpi: "Eficiencia de Cartera (Loss Ratio)",
        valor: lossRatio.toFixed(2) + "%",
        diagnostico: lossRatio > 80 ? "Crítico: Revisar Siniestralidad" : "Saludable",
        meta: "< 60%"
      },
      {
        kpi: "Valor Medio Póliza (Ticket Promedio)",
        valor: avgTicket.toFixed(2) + "€",
        diagnostico: avgTicket > 700 ? "Segmento Premium" : "Segmento Estándar",
        meta: "> 750€"
      },
      {
        kpi: "Ratio de Frecuencia",
        valor: activePolicies.length > 0 ? ((tenantClaims.length / activePolicies.length) * 100).toFixed(1) + "%" : "0%",
        diagnostico: "Incidencia de siniestros por póliza",
        meta: "10%"
      },
      {
        kpi: "Volumen de Negocio (GWP)",
        valor: totalPremium.toLocaleString() + "€",
        diagnostico: "Primas totales activas",
        meta: "Crecimiento Sostenido"
      }
    ]
  };
};

module.exports = {
  getVisibleClients,
  getVisibleRelatedData,
  getTenantAnalytics,
  getHighRiskElements,
  getProductAnalytics
};
