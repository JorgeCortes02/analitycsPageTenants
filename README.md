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

## 📊 Capa Analítica de Producto (Opción B)

Esta sección implementa una infraestructura de inteligencia de negocio (BI) diseñada para administradores y gerentes de la correduría. A diferencia de las vistas operativas, esta capa procesa grandes volúmenes de datos para ofrecer una visión estratégica del rendimiento del **Tenant**.

### 📈 Métricas Relevantes Calculadas

* **Loss Ratio (Siniestralidad):** Mide la eficiencia financiera global comparando los ingresos por primas contra los pagos efectuados por siniestros.
* **Velocidad de Respuesta (SLA Medio):** Calcula el tiempo promedio (en días) desde la apertura hasta el cierre de un siniestro, evaluando la agilidad operativa del equipo.
* **Fidelización (Venta Cruzada / Cross-sell):** Ratio de pólizas por cliente único. Indica la penetración de productos y la capacidad de retención de la cartera.
* **Ratio de Frecuencia:** Porcentaje de incidencia de siniestros por cada 100 pólizas activas, detectando desviaciones en la siniestralidad esperada.
* **Ticket Promedio:** Valor medio de la prima anual por póliza, segmentando el posicionamiento de precio del Tenant (Premium vs. Estándar).
* **Volumen de Negocio (GWP):** Suma total de Primas Brutas Suscritas (Gross Written Premiums) activas bajo gestión.
* **Rentabilidad por Segmento (`policy_type`):** El sistema desglosa automáticamente el *Loss Ratio* por tipo de póliza (Comercio, Hogar, Auto, etc.). Esto permite identificar con precisión qué líneas de negocio son rentables y cuáles requieren una revisión de tarifas.
* **Diagnóstico del estado de la salud del tenant:** Basado en umbrales de negocio predefinidos, el sistema genera diagnósticos textuales (ej: "Crítico: Pérdida Neta", "Baja: Potencial de Venta") para facilitar la toma de decisiones sin necesidad de análisis técnico previo.


### 🤖 Optimización para IA (AI-Ready)

El esquema de datos devuelto por el servidor incluye un objeto `summary` diseñado específicamente para ser consumido por agentes de IA:
* **Evita Alucinaciones:** Al entregar cálculos ya procesados en el backend, la IA no necesita realizar operaciones matemáticas, eliminando errores de precisión.
* **Contexto Ejecutivo:** Proporciona conclusiones estructuradas que permiten a un modelo de lenguaje generar informes de gestión coherentes y recomendaciones estratégicas de forma inmediata.

## 🚀 Ejecución del Proyecto

### Requisitos
* Node.js v18.11+
* npm

### 1. Instalación
En ambos proyectos (back y front) se debera hacer un npm intall para instalar dependencias.

Para levantar el backend se debera hacer un node server.js
Para levantar el front se debera hacer un npm run dev

