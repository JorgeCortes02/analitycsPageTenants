const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');


const { 
    getVisibleClients, 
    getTenantAnalytics, 
    getHighRiskElements, 
    getVisibleRelatedData,
    getProductAnalytics
} = require('./logic');
const app = express();
app.use(cors());
app.use(express.json());

const loadData = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, `./data/${file}.json`)));


const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const users = loadData('users');
    const user = users.find(u => u.user_id === userId);

    if (!user) return res.status(401).json({ error: "Usuario no autorizado o no encontrado" });
    
    req.currentUser = user;
    next();
};



app.get('/api/auth/available-users', (req, res) => {

    const users = loadData('users');
    res.json(users);
});


app.get('/api/clients', authMiddleware, (req, res) => {
    const clients = loadData('clients');
    const result = getVisibleClients(req.currentUser, clients);
    res.json(result);
});





app.get('/api/analytics', authMiddleware, (req, res) => {
   
    const allClients = loadData('clients');
    const allPolicies = loadData('policies');
    const allClaims = loadData('claims');

    const visibleClients = getVisibleClients(req.currentUser, allClients);
    const visibleClientIds = visibleClients.map(c => c.client_id);

    const vPolicies = getVisibleRelatedData(req.currentUser, allPolicies, visibleClientIds);
    const vClaims = getVisibleRelatedData(req.currentUser, allClaims, visibleClientIds);

    const result = getTenantAnalytics(req.currentUser, vPolicies, vClaims);
    res.json(result);
});


app.get('/api/risk', authMiddleware, (req, res) => {
    try {
        const allClients = loadData('clients');
        const allPolicies = loadData('policies');
        const allClaims = loadData('claims');

       
        const visibleClients = getVisibleClients(req.currentUser, allClients);
        
        const result = getHighRiskElements(
            req.currentUser, 
            visibleClients, 
            allPolicies, 
            allClaims
        );
        
        res.json(result);
    } catch (error) {
        console.error("Error en riesgo:", error);
        res.status(500).json([]);
    }
});



// server.js

app.get('/api/analytics/product', authMiddleware, (req, res) => {
  try {
    const user = req.currentUser; 

    // 1. Carga de datos (con fallback a array vacío para evitar errores de .filter)
    const allClients = loadData('clients') || [];
    const allPolicies = loadData('policies') || [];
    const allClaims = loadData('claims') || [];


    // Solo extraemos lo que pertenece al usuario logueado
    const tenantClients = allClients.filter(c => c.tenant_id === user.tenant_id);
    const tenantPolicies = allPolicies.filter(p => p.tenant_id === user.tenant_id);
    const tenantClaims = allClaims.filter(c => c.tenant_id === user.tenant_id);

   
    // Ahora enviamos los datos filtrados a la función de la Opción B
    const productMetrics = getProductAnalytics(tenantPolicies, tenantClaims, tenantClients);

    
    res.json({
      success: true,
      role: user.role, 
      tenant: user.tenant_id,
      ...productMetrics 
    });

  } catch (error) {
    console.error("❌ Error en analíticas de producto:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error interno al procesar KPIs de negocio" 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Back corriendo en http://localhost:${PORT}`));
