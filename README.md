# 🎬 SimuTimer Cine — Medición de Colas & Tiempos para Simulación

Aplicación web desarrollada para la recolección de muestras de campo de la materia **Simulación** (Trabajo Práctico Integrador). Permite al equipo de **5 integrantes medir tiempos en simultáneo** desde diferentes celulares o laptops con **sincronización instantánea en la nube mediante Supabase (PostgreSQL)**.

---

## 👥 Integrantes del Equipo
1. **Camila**
2. **Cecilia**
3. **Gianella**
4. **Ramiro**
5. **Valentino**

---

## 🎟️ Modelo del Sistema de Colas (Cine)

El software está dedicado al relevamiento del sistema de colas del cine:

1. **Canal 1 — Tótem de Autoservicio:**
   - **Cola Tótem (FIFO):** Cronometraje del tiempo de espera en cola ($W_q$) de cada cliente.
   - **Autoservicio:** Proceso de atención ($W_s$) exclusivamente para retiro de entradas adquiridas previamente por la app web.
2. **Canal 2 — Atención Personalizada (Boletería):**
   - **Cola Cajero (FIFO):** Fila única común para clientes que esperan atención personalizada.
   - **2 Cajeros Simultáneos (Cajero 1 y Cajero 2):** Permiten atender a dos personas al mismo tiempo.
   - **Distinción de Trámite:** Indicador interactivo para registrar si el cliente va a **💳 Compra de entradas** o **📱 Retiro de entradas (App Web)**.

---

## 🚀 Características Principales

- **Cronometraje en Simultáneo:** Cada cola y cada servidor operan cronómetros de forma independiente sin bloquearse entre sí.
- **Colas FIFO Dinámicas:** Marca las llegadas con un clic (`+ Llegada a Cola`) y pasa clientes a los servidores respetando el orden de llegada.
- **Métricas de Teoría de Colas:** Registro desglosado de Tiempo en Cola ($W_q$), Tiempo de Atención ($W_s$) y Tiempo Total en Sistema ($W$).
- **Sincronización en Tiempo Real:** Las mediciones tomadas por cualquier compañero en su teléfono aparecen inmediatamente en la laptop de los demás.
- **Exportación CSV para Ajuste de Bondad:** Descarga directa formateada con las columnas $W_q$, $W_s$, $W$ y tipo de trámite para importar en Excel, R, Python o InfoStat.
- **Modo Híbrido Offline / Local:** Si la señal en el cine es débil, los datos se guardan en el navegador sin pérdidas.

---

## 🗄️ Configuración de Supabase (Base de Datos)

1. En [supabase.com](https://supabase.com), crea tu proyecto.
2. En el **SQL Editor**, copia y ejecuta el script [`supabase_schema.sql`](./supabase_schema.sql).
3. Obtén tu **Project URL** y **anon key**.
4. Puedes ingresarlas directamente desde la barra superior de la app haciendo clic en **Supabase** o cargarlas como variables de entorno en Vercel (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

---

## 🌐 Despliegue en Vercel

```bash
git add .
git commit -m "feat: sistema de colas cine con colas FIFO y 2 cajeros"
git push -u origin main
```

En Vercel:
1. Importa el repositorio `counter-simulacion`.
2. Framework Preset: **Vite**.
3. Deploy!
