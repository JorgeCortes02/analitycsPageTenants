# 🛡️ Insurance Analytics Platform: Multi-Tenant & Product Insights

Esta solución es una plataforma analítica diseñada para corredurías de seguros, donde se gestionan múltiples entidades (Tenants) y roles de usuario bajo una arquitectura robusta y escalable.

El proyecto resuelve de forma integrada los dos desafíos propuestos:
- **Opción A:** Seguridad, control de acceso (RBAC) y multi-tenancy.
- **Opción B:** Capa analítica de negocio preparada para producto y agentes de IA.

---

## 🏗️ Arquitectura de la Solución

### 1. Opción A: Gestión Multi-Tenant y Seguridad (RBAC)
Se ha implementado una capa de servicio en el Backend que garantiza el aislamiento total de los datos.

* **Aislamiento de Datos:** Todas las peticiones están filtradas por `tenant_id` en el servidor. Un usuario nunca podrá acceder a datos de otra correduría.
* **Reglas de Acceso por Rol:**
    * **Admin:** Visibilidad total de los datos de su Tenant.
    * **Manager:** Visibilidad de todo el Tenant con **Enmascaramiento de Datos Sensibles**. Los campos de contacto (Email/Teléfono) de clientes con bajo score de sensibilidad se ocultan automáticamente para evitar robo de clientes de alto valor si el manager se va a otra empresa.
    * **Agent:** Restricción por propiedad. Solo puede ver clientes y pólizas donde figura como el usuario asignado.
* **Gestión de Riesgos Operativos:** Lógica de detección de alertas en `/api/risk` con un sistema de semáforo:
    * 🔴 **CRITICAL:** Siniestralidad > 100% (Gasto mayor que ingreso).
    * 🟡 **HIGH:** Siniestralidad > 75% (Umbral preventivo de riesgo) o Score de sensibilidad alto.

### 2. Opción B: Capa Analítica de Producto (Business Intelligence)
Se ha definido una **Vista Analítica Agregada** en el endpoint `/api/analytics/product` que transforma datos crudos en métricas de alto valor para negocio.

* **Métricas Relevantes Calculadas:**
    1.  **Loss Ratio (Siniestralidad):** Eficiencia financiera de la cartera.
    2.  **Ticket Promedio:** Valor medio de prima por póliza activa.
    3.  **Ratio de Frecuencia:** Incidencia de siniestros por volumen de pólizas.
    4.  **Volumen de Negocio (GWP):** Suma total de primas activas.
    5.  **Diagnóstico de Salud:** Interpretación textual automática de los KPIs para toma de decisiones rápida.
* **Preparación para IA:** El esquema de datos está optimizado para que agentes de IA puedan extraer conclusiones sin realizar cálculos manuales, evitando errores de precisión (alucinaciones).

---

## 🚀 Ejecución del Proyecto

### Requisitos
* Node.js v18.11+
* npm

### 1. Instalación
En ambos proyectos (back y front) se debera hacer un npm intall para instalar dependencias.

Para levantar el backend se debera hacer un node server.js
Para levantar el front se debera hacer un npm run dev

