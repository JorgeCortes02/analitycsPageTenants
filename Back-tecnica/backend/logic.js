
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

/*
  Filtra pólizas y siniestros basándose en la visibilidad del cliente.
 */
const getVisibleRelatedData = (user, dataArray, visibleClientIds) => {
  // Solo devolvemos datos que pertenezcan a los clientes que el usuario ya puede ver
  return dataArray.filter(
    (item) =>
      item.tenant_id === user.tenant_id &&
      visibleClientIds.includes(item.client_id),
  );
};

/*
 Obtenemos analiticas filtradas por user, estas no son las que hablan del tenant en general
 */
const getTenantAnalytics = (user, visiblePolicies, visibleClaims) => {
  const activePolicies = visiblePolicies.filter((p) => p.status === "active");

  return {
    roleScope: user.role === "agent" ? "Personal Portfolio" : "Global Tenant",
    metrics: {
     
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

/*
Extraemos a aquellos clientes que tienen una situacion de riesgo
 */

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

      
      // Gasto mayor que ingreso
      if (totalClaimed > totalPremium && totalClaimed > 0) {
        riskLevel = "CRITICAL";
        reasons.push("Gasto mayor que Ingreso");
      } 
      //Score de sensibilidad muy alto (Peligro de fraude/seguridad)
      else if (Number(client.sensitive_score) > 90) { 
        riskLevel = "CRITICAL";
        reasons.push("Perfil de Seguridad Crítico");
      }

      
      //Siniestralidad entre el 75% y el 100%
      else if (totalClaimed >= (totalPremium * 0.75)) {
        riskLevel = "HIGH";
        reasons.push("Siniestralidad elevada (>75%)");
      }
      
      //Score de sensibilidad medio-alto
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

/*
 CAPA ANALÍTICA DE PRODUCTO (OPCIÓN B) - Filtrada por Tenant
 Esta función recibe los datos ya filtrados por el Tenant del usuario desde el servidor.
 */

const getProductAnalytics = (tenantPolicies, tenantClaims, tenantClients) => {
  const activePolicies = tenantPolicies.filter(p => p.status === 'active');
  const totalPremium = activePolicies.reduce((acc, p) => acc + (Number(p.annual_premium) || 0), 0);
  const totalClaimsCost = tenantClaims.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  //Calculamos los ingresos/gastos
  const lossRatio = totalPremium > 0 ? (totalClaimsCost / totalPremium) * 100 : 0;

  //Calculamos la cantidad de polizas por cliente 
  const crossSell = tenantClients.length > 0 ? (tenantPolicies.length / tenantClients.length) : 0;
  
  //Calculamos los dias de media que se tarda en cerrar una incidencia
  const closedClaims = tenantClaims.filter(c => c.status === 'closed' && c.closed_at);
  const avgSLA = closedClaims.length > 0 
    ? (closedClaims.reduce((acc, c) => acc + Math.ceil(Math.abs(new Date(c.closed_at) - new Date(c.opened_at)) / (1000 * 60 * 60 * 24)), 0) / closedClaims.length)
    : 0;

  const frequency = activePolicies.length > 0 ? (tenantClaims.length / activePolicies.length) * 100 : 0;

  //Reducimos las polizas activas y sumamos lo que se paga por ellas y el costo de las incidencias de las mismas agrupandolo por grupos
  const typeStats = activePolicies.reduce((acc, policy) => {
    
    const type = policy.policy_type || 'Otros'; 
    
    if (!acc[type]) acc[type] = { premium: 0, claims: 0, count: 0 };

    acc[type].premium += Number(policy.annual_premium) || 0;
    acc[type].count += 1;

    const policyClaims = tenantClaims.filter(c => c.policy_id === policy.policy_id);
    acc[type].claims += policyClaims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return acc;
  }, {});
//Calculamos el % en base a los datos de la función anterior.
  const profitabilityByType = Object.keys(typeStats).map(name => {
    const p = typeStats[name].premium;
    const c = typeStats[name].claims;
    const ratio = p > 0 ? (c / p) * 100 : 0;
    
    return {
      name: name.toUpperCase(),
      ratio: ratio.toFixed(1) + "%",
      rawRatio: ratio,
      count: typeStats[name].count
    };
  });

  return {
    metrics: [
      {
        kpi: "Eficiencia de Cartera (Loss Ratio)",
        valor: lossRatio.toFixed(2) + "%",
        diagnostico: lossRatio > 100 ? "Crítico: Pérdida Neta" : lossRatio > 60 ? "Aviso: Margen Estrecho" : "Saludable",
        meta: "< 60%",
        contexto: "Balance global de ingresos vs gastos por siniestros."
      },
      {
        kpi: "Velocidad de Respuesta (SLA)",
        valor: avgSLA > 0 ? `${avgSLA.toFixed(1)} días` : "S/D",
        diagnostico: avgSLA > 12 ? "Lento: Revisar Operativa" : "Eficiente",
        meta: "< 12 días",
        contexto: "Tiempo promedio de cierre de siniestros."
      },
      {
        kpi: "Fidelización (Venta Cruzada)",
        valor: crossSell.toFixed(2) + " pzs/cli",
        diagnostico: crossSell < 1.8 ? "Baja: Potencial de Venta" : "Alta: Cartera Sólida",
        meta: "> 1.8",
        contexto: "Promedio de pólizas por cada cliente."
      },
      {
        kpi: "Ratio de Frecuencia",
        valor: frequency.toFixed(1) + "%",
        diagnostico: frequency > 20 ? "Alta Siniestralidad" : "Normal",
        meta: "< 15%",
        contexto: "Siniestros declarados por cada 100 pólizas."
      },
      {
        kpi: "Valor Medio Póliza (Ticket)",
        valor: (totalPremium / (activePolicies.length || 1)).toFixed(2) + "€",
        diagnostico: "Posicionamiento de Precio",
        meta: "> 750€",
        contexto: "Importe medio de la prima anual."
      }
    ],
    summary: {
      tenant_health: lossRatio > 90 ? "CRITICAL" : lossRatio > 60 ? "WARNING" : "HEALTHY",
      total_active_premium: totalPremium,
      total_claims_cost: totalClaimsCost,
      worst_performing_type: profitabilityByType.sort((a,b) => b.rawRatio - a.rawRatio)[0],
      profitabilityByType
    }
  };
};
module.exports = {
  getVisibleClients,
  getVisibleRelatedData,
  getTenantAnalytics,
  getHighRiskElements,
  getProductAnalytics
};
