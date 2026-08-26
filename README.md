# ⏱️ SimuTimer — Toma de Tiempos para Sistemas de Colas & Procesos

Aplicación web desarrollada para la recolección de muestras de campo de la materia **Simulación**. Permite a un equipo de hasta **5 usuarios medir tiempos en simultáneo** desde diferentes dispositivos, cronometrando individualmente cada proceso y el tiempo total de permanencia en el sistema.

---

## 🚀 Características Principales

- **Selector Rápido de 5 Usuarios (Sin Contraseña)**: Al abrir la app, cada integrante elige su perfil con 1 solo clic.
- **Configuración de Nombres de Usuarios**: Panel para personalizar los nombres de los 5 integrantes del equipo de trabajo.
- **Gestión Dinámica de Sistemas y Procesos**: Permite crear cualquier sistema de simulación (ej. *Caja de Supermercado*, *Atención en Banco*, *Lavadero de Autos*) y definir su secuencia ordenada de procesos ($P_1, P_2, \dots, P_n$).
- **Cronómetro Técnico de Alta Precisión**:
  - Medición simultánea del **Tiempo de Proceso Actual** y **Tiempo Total del Sistema** con precisión de centésimas de segundo.
  - Botón táctil grande de transición rápida entre procesos (*Siguiente Proceso*).
  - Botón de *Finalizar y Guardar* que almacena la muestra completa al terminar.
  - Opción de *Descartar Muestra* con confirmación de seguridad.
- **Toma Concurrente / Multiusuario**: Varios usuarios pueden cronometrar al mismo tiempo desde sus celulares o computadoras sin interferir entre sí.
- **Panel de Registros y Muestras**:
  - Visualización ordenada en tabla técnica con fecha, hora, usuario, tiempos parciales y tiempo total.
  - Filtros instantáneos por Sistema y por Usuario.
  - Eliminación de muestras erróneas.
  - **Exportación a CSV / Excel**: Descarga directa de datos con formato compatible para herramientas de ajuste de distribución (Arena Input Analyzer, Stat::Fit, Python, R, Excel).
- **Indicador de Salud de Backend & Petición Bandera (Flag Endpoint)**:
  - Botón en la barra superior que comprueba el estado del backend (`GET /api/health`) con indicador visual (🟢 Online, 🟡 Despertando, ⚪ Offline).
  - Alerta especial para servidores gratuitos de Render (que entran en reposo tras 15 minutos).
  - Modo offline/local automático para que nunca se pierda una medición en el campo.

---

## 🛠️ Ejecución Local

### 1. Requisitos
- Node.js (v18+) y npm

### 2. Instalar Dependencias

```bash
# Dependencias del Frontend (en la raíz)
npm install

# Dependencias del Backend
cd backend
npm install
cd ..
```

### 3. Iniciar en Desarrollo

**Opción A: Iniciar Frontend (con almacenamiento local o proxy)**
```bash
npm run dev
# Abrir http://localhost:5173
```

**Opción B: Iniciar Backend y Frontend en paralelo**
```bash
# Terminal 1 - Backend:
cd backend
npm run dev
# Backend corriendo en http://localhost:3001

# Terminal 2 - Frontend:
npm run dev
# Frontend corriendo en http://localhost:5173
```

---

## 🌐 Despliegue en la Nube (100% Gratis)

### Paso 1: Subir el proyecto a tu GitHub

1. Inicializa el repositorio y haz el primer commit:
```bash
git init
git add .
git commit -m "feat: app de toma de tiempos para simulación"
```
2. Crea un nuevo repositorio en tu [GitHub](https://github.com/new) llamado `counter-simulacion`.
3. Conecta y sube el código:
```bash
git remote add origin https://github.com/TU_USUARIO/counter-simulacion.git
git branch -M main
git push -u origin main
```

---

### Paso 2: Desplegar el Backend en Render

1. Ve a [Render.com](https://render.com) e inicia sesión con tu GitHub.
2. Haz clic en **New +** $\to$ **Web Service**.
3. Selecciona tu repositorio `counter-simulacion`.
4. Configura los siguientes campos:
   - **Name**: `counter-simulacion-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Haz clic en **Deploy Web Service**.
6. Una vez desplegado, copia la URL que te da Render (ej: `https://counter-simulacion-api.onrender.com`).

---

### Paso 3: Desplegar el Frontend en Vercel

1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz clic en **Add New...** $\to$ **Project**.
3. Importa tu repositorio `counter-simulacion`.
4. En **Environment Variables**, agrega:
   - `VITE_API_URL`: pega la URL de tu backend en Render (ej: `https://counter-simulacion-api.onrender.com`)
5. Haz clic en **Deploy**.
6. ¡Listo! Vercel te dará la URL pública para compartir con tus 5 compañeros de equipo.

> [!TIP]
> En la app web desplegada, también puedes hacer clic en la pastilla del estado del servidor (arriba a la derecha) y pegar o cambiar la URL del backend en cualquier momento sin necesidad de re-desplegar.

---

## 👥 Estructura del Proyecto

```
Counter/
├── backend/                  # API REST Express + TypeScript
│   ├── src/
│   │   ├── index.ts          # Servidor Express y CORS
│   │   ├── routes.ts         # Endpoints REST y /api/health
│   │   ├── store.ts          # Persistencia en base de datos JSON
│   │   └── types.ts          # Modelos y esquemas
│   ├── package.json
│   └── tsconfig.json
├── src/                      # Frontend Vite + React + TypeScript
│   ├── components/
│   │   ├── Navbar.tsx        # Navegación, usuario y estado de servidor
│   │   ├── TimerEngine.tsx   # Cronómetro de procesos y sistema
│   │   ├── RecordsPanel.tsx  # Tabla técnica, filtros y exportación CSV
│   │   ├── SystemManager.tsx # Creación dinámica de sistemas y procesos
│   │   ├── UserSelectionModal.tsx # Selección de los 5 usuarios
│   │   ├── UserSettingsModal.tsx  # Configurar nombres de integrantes
│   │   └── BackendStatusModal.tsx # Comprobar salud y latencia
│   ├── lib/
│   │   ├── api.ts            # Cliente unificado con fallback offline
│   │   ├── storage.ts        # Almacenamiento local
│   │   ├── formatters.ts     # Formato de tiempos y fechas
│   │   └── exportUtils.ts    # Generación de planilla CSV
│   ├── types/                # Tipos TypeScript
│   ├── App.tsx               # Aplicación principal
│   └── main.tsx
├── render.yaml               # Configuración automática de Render
├── vercel.json               # Configuración de Vercel SPA
└── README.md
```
