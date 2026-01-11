# 📘 Documentación Maestra del Sistema Finance Tracker

**Versión del Documento:** 1.2
**Última Actualización:** Enero 2024
**Autor:** Antigravity (IA Agent @ Nezu)

---

## 📑 Tabla de Contenidos

1.  **Visión General**
2.  **Arquitectura del Sistema**
3.  **Configuración del Proyecto (Setup)**
4.  **Backend (Finance API)**
    *   Modelos y Esquema de Datos
    *   Autenticación (JWT)
    *   Endpoints Principales
5.  **Frontend (Finance Web)**
    *   Estructura del Proyecto
    *   Gestión de Estado y Persistencia
    *   Estrategia Offline-First (Sincronización)
    *   Diseño Responsivo y UX Móvil
6.  **Despliegue y Mantenimiento**

---

## 1. Visión General

**Finance Tracker** es una plataforma integral de gestión financiera personal diseñada con una filosofía "Offline-First". Permite a los usuarios registrar transacciones, planificar pagos y visualizar balances semanales sin depender de una conexión a internet constante.

El sistema se compone de una API robusta en Django (DRF) y una PWA moderna en Next.js, sincronizadas mediante un protocolo diferencial (Push/Pull).

---

## 2. Arquitectura del Sistema

El sistema sigue una arquitectura cliente-servidor desacoplada:

*   **Base de Datos (Producción):** PostgreSQL.
*   **Backend:** Dockerized Django REST Framework.
*   **Frontend:** Next.js 14 (App Router) alojado en Vercel.
*   **Almacenamiento Local (Cliente):** IndexedDB (vía Dexie.js) para datos transaccionales masivos y LocalStorage para tokens de sesión.

---

## 3. Configuración del Proyecto (Setup)

### 3.1 Prerrequisitos
*   Python 3.10+
*   Node.js 18+
*   PostgreSQL (Local o Docker)

### 3.2 Variables de Entorno (.env)

**Backend (`finance-api/.env`)**:
```bash
DEBUG=True
SECRET_KEY=tu_clave_secreta_django
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:password@localhost:5432/finance_tracker
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend (`finance-web/.env.local`)**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3.3 Comandos de Instalación
```bash
# Backend
cd finance-api
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend
cd finance-web
npm install
npm run dev
```

---

## 4. Backend (Finance API)

El núcleo lógico reside en `finance-api`. Se divide en dos aplicaciones principales: `accounts` (Usuarios) y `finance` (Negocio).

### 4.1 Modelos de Datos (`apps/finance/models.py`)

1.  **`Transaction` (Transacción)**:
    *   El átomo del sistema. Representa un ingreso o gasto.
    *   Campos clave: `amount`, `type` (INCOME/EXPENSE), `date`, `counterparty`.
    *   Relación: Puede estar vinculada a un `ScheduledPayment`.

2.  **`ScheduledPayment` (Pago Programado)**:
    *   Representa una obligación futura (ej. Renta, Netflix).
    *   Estados: `PENDING` -> `PAID`.
    *   Al pagarse, genera automáticamente una `Transaction`.

3.  **`WeeklyPeriod` (Periodo Semanal)**:
    *   Snapshot del balance al inicio de cada semana.
    *   Permite cálculos de rendimiento "semana a semana" rápidos sin recalcular todo el historial.

### 4.2 Autenticación (Seguridad)
Se utiliza **JWT (JSON Web Tokens)** vía `simplejwt`.
*   **Access Token**: Vida corta (60 min). Se usa para peticiones.
*   **Refresh Token**: Vida larga (30 días). Se usa para obtener nuevos Access Tokens sin re-login.
*   **Rotación**: Cada uso del Refresh Token genera uno nuevo, aumentando la seguridad.

---

## 5. Frontend (Finance Web)

Aplicación construida con **Next.js 14**, priorizando velocidad y UX nativa.

### 5.1 Estructura Clave (Backend)
```
finance-api/
├── apps/                # Aplicaciones Django (accounts, finance)
├── core/                # Configuración (settings.py, urls.py)
├── scripts/             # Herramientas de Mantenimiento y Seed
│   ├── seed_data.py     # Carga datos de prueba
│   ├── inspect_db.py    # Auditoría rápida de BD
│   ├── reset_and_seed.py# Limpieza y reseteo total
│   └── create_admin.py  # Creación de superusuario
├── manage.py            # Entry point de Django
└── .env                 # Variables de entorno
```

### 5.2 Estructura Clave (Frontend)
```
src/
├── app/                 # Rutas (App Router)
│   ├── (auth)/          # Pantallas públicas (Login)
│   ├── dashboard/       # Pantalla principal
│   ├── transactions/    # Historial y Tablas
├── components/
│   ├── layout/          # Sidebar, Header, AuthWrapper
│   ├── ui/              # Componentes base (Botones, Inputs)
├── hooks/               # Lógica reutilizable (useSync, useAuth)
├── lib/
│   ├── db.ts            # Esquema Dexie (IndexedDB)
│   ├── api-client.ts    # Axios con interceptores
│   ├── constants.ts     # Versión de la APP
├── store/               # Estado Global (Zustand)
```

### 5.2 Estrategia Offline (Sincronización)
El hook `use-sync.ts` es el cerebro de la consistencia de datos.

1.  **Escritura Optimista**: El usuario guarda un dato -> Se escribe en Dexie (`is_synced: 0`) -> La UI se actualiza instantáneamente.
2.  **Push (Subida)**: Al detectar red/login, se envían los registros sucios (`is_synced: 0`) al endpoint `/sync/push/`.
3.  **Pull (Bajada)**: Se consulta `/sync/pull/` enviando la fecha `last_sync_at`. El servidor responde solo con lo nuevo/modificado.
4.  **Convergencia**: Se actualiza la BD local y se marca todo como `is_synced: 1`.

### 5.3 UX Móvil y Adaptabilidad
El sistema utiliza **Breakpoints Estrictos** para simular una app nativa:

*   **Mobile (<768px)**:
    *   **Bottom Bar**: Navegación principal fija al pie.
    *   **Header**: Simplificado, solo con botón "Salir".
    *   **Tablas**: Contenidas en `max-w-[calc(100vw-3rem)]` para scroll interno seguro.
*   **Landscape/Tablet (>=768px)**:
    *   **Sidebar**: Menú lateral colapsado (sólo iconos).
    *   **Bottom Bar**: Oculta.
*   **Desktop (>=1024px)**:
    *   **Sidebar**: Completamente expandido.

---

## 6. Despliegue y Mantenimiento

### 6.1 Versionado y Limpieza (Cache Busting)
Para evitar conflictos de esquema en actualizaciones:
1.  Editar `src/lib/constants.ts` y subir `APP_VERSION`.
2.  El componente `AuthWrapper` en el cliente detectará la discrepancia.
3.  **Acción Automática**: Logout forzado + Borrado de IndexedDB/LocalStorage + Recarga.

### 6.2 Pipelines de Despliegue
*   **Frontend**: Push a rama `main` dispara deploy en Vercel.
*   **Backend**: Push a rama `main` dispara build en Render (Docker).
    *   *Nota*: Asegurar ejecutar migraciones (`python manage.py migrate`) tras cambios en modelos.

---

> **Nota Final:** Esta documentación debe ser actualizada cada vez que se agreguen nuevos módulos o se cambie la lógica core de sincronización.
