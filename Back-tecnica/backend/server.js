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

// Función auxiliar para leer los JSON
const loadData = (file) => JSON.parse(fs.readFileSync(path.join(__dirname, `./data/${file}.json`)));

// --- MIDDLEWARE DE AUTENTICACIÓN ---
// Identifica al usuario por el header 'x-user-id'
const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const users = loadData('users');
    const user = users.find(u => u.user_id === userId);

    if (!user) return res.status(401).json({ error: "Usuario no autorizado o no encontrado" });
    
    req.currentUser = user;
    next();
};

// --- RUTAS PÚBLICAS (Solo para el selector del Frontend) ---

app.get('/api/auth/available-users', (req, res) => {
    // Devuelve todos los usuarios para poder "simular" el login en la interfaz
    const users = loadData('users');
    res.json(users);
});

// --- RUTAS PROTEGIDAS (Requieren x-user-id) ---

// 1. Clientes visibles (con enmascaramiento para Managers y filtro para Agentes)
app.get('/api/clients', authMiddleware, (req, res) => {
    const clients = loadData('clients');
    const result = getVisibleClients(req.currentUser, clients);
    res.json(result);
});




// 5. Resumen analítico del tenant (Basado solo en lo que el usuario puede ver)
app.get('/api/analytics', authMiddleware, (req, res) => {
    // Para el análisis, primero obtenemos los datos que el usuario tiene permitidos
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

        // USAMOS las funciones directamente porque las importamos con { } arriba
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



app.get('/api/analytics/product', authMiddleware, (req, res) => {
  try {
    const user = req.currentUser; // El middleware nos da el usuario logueado

    // 1. Cargar datos crudos
    const allClients = loadData('clients');
    const allPolicies = loadData('policies');
    const allClaims = loadData('claims');

    // 2. FILTRAR POR TENANT (Seguridad de datos)
    const tenantClients = allClients.filter(c => c.tenant_id === user.tenant_id);
    const tenantPolicies = allPolicies.filter(p => p.tenant_id === user.tenant_id);
    const tenantClaims = allClaims.filter(c => c.tenant_id === user.tenant_id);

    // 3. Calcular métricas SOLO para este tenant
    const productMetrics = getProductAnalytics(tenantPolicies, tenantClaims, tenantClients);

    res.json({
      success: true,
      data: productMetrics,
      tenant: user.tenant_id 
    });
  } catch (error) {
    console.error("Error en analíticas de producto:", error);
    res.status(500).json({ success: false, message: "Error al calcular métricas" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Back corriendo en http://localhost:${PORT}`));
