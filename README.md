# ⏱️ SimuTimer — Toma de Tiempos para Simulación (Sistemas de Colas & Procesos)

Aplicación web desarrollada para la recolección de muestras de campo de la materia **Simulación**. Permite a un equipo de hasta **5 usuarios medir tiempos en simultáneo** desde diferentes dispositivos (celulares o laptops) con **sincronización instantánea en la nube mediante Supabase (PostgreSQL)**.

---

## 🚀 Características Principales

- **Selector Rápido de 5 Usuarios (Sin Contraseña)**: Al abrir la web, cada integrante elige su perfil con 1 solo clic.
- **Configuración de Nombres de Usuarios**: Panel para personalizar los nombres de los 5 integrantes del equipo.
- **Gestión Dinámica de Sistemas y Procesos**: Permite crear cualquier sistema de simulación (ej. *Caja de Supermercado*, *Atención en Banco*, *Lavadero de Autos*) y definir su secuencia ordenada de procesos ($P_1, P_2, \dots, P_n$), con posibilidad de eliminarlos o editarlos.
- **Cronómetro Técnico de Alta Precisión**:
  - Medición simultánea del **Tiempo de Proceso Actual** y **Tiempo Total del Sistema** con precisión de centésimas de segundo.
  - Botón táctil grande de transición rápida entre procesos (*Siguiente Proceso*).
  - Botón de *Finalizar y Guardar* que almacena la muestra completa al terminar.
  - Opción de *Descartar Muestra* con confirmación de seguridad.
- **Multiusuario & Tiempo Real con Supabase**:
  - Cero arranques en frío (*zero cold starts*).
  - Si un usuario registra una muestra desde su celular, aparece instantáneamente en la tabla de todos los demás dispositivos vía WebSockets.
- **Panel de Registros y Muestras**:
  - Visualización ordenada en tabla técnica con fecha, hora, usuario, tiempos parciales y tiempo total.
  - Filtros instantáneos por Sistema y por Usuario.
  - Eliminación de muestras erróneas.
  - **Exportación a CSV / Excel**: Descarga de datos compatible con herramientas de ajuste de distribución (Arena Input Analyzer, Stat::Fit, Python, R, Excel).
- **Modo Híbrido Offline / Local**: Si no tienes internet en el campo, los datos se guardan en el navegador y no se pierde ninguna medición.

---

## 🗄️ Configuración de la Base de Datos en Supabase (Gratis en 1 Minuto)

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Haz clic en **New Project**, ponle un nombre (ej: `simutimer`) y una contraseña para la base de datos.
3. En el menú lateral izquierdo, entra a **SQL Editor** $\to$ **New query**.
4. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql), copia todo su contenido, pégalo en el editor de Supabase y presiona el botón verde **Run**.
5. Ve a **Project Settings** (ícono de engranaje abajo a la izquierda) $\to$ **API**.
6. Copia tu **Project URL** y tu **anon public Key**.

> [!TIP]
> Puedes pegar estas credenciales directamente dentro de la aplicación haciendo clic en la pastilla de la barra superior (**Supabase / Modo Local**), o cargarlas en Vercel como variables de entorno.

---

## 🌐 Despliegue en Vercel (100% Gratis)

### Paso 1: Subir el proyecto a tu GitHub

1. En tu terminal:
```bash
git add .
git commit -m "feat: migracion a Supabase con tiempo real"
git push -u origin main
```

---

### Paso 2: Desplegar en Vercel

1. Ve a [Vercel.com](https://vercel.com) e inicia sesión con tu GitHub.
2. Haz clic en **Add New...** $\to$ **Project** e importa el repositorio `counter-simulacion`.
3. En **Environment Variables**, puedes agregar (opcional si las pegas en la app):
   - `VITE_SUPABASE_URL`: tu Project URL de Supabase (ej: `https://xyzabcdefg.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY`: tu anon public key
4. Haz clic en **Deploy**.
5. ¡Listo! Comparte la URL de Vercel con tus 5 compañeros de equipo.

---

## 🛠️ Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# Abrir http://localhost:5173
```
