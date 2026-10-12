import React from 'react';
import { Monitor, Ticket, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface CinemaSystemInfoProps {
  onGoToTimer: () => void;
}

export const CinemaSystemInfo: React.FC<CinemaSystemInfoProps> = ({ onGoToTimer }) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-bold border border-indigo-500/40">
              <span>Trabajo Práctico Integrador — Simulación</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Sistema de Colas del Cine: Colas y Servidores
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              El sistema cuenta con <strong>2 colas FIFO</strong> (Cola Tótem y Cola Cajero) y <strong>2 procesos de servicio</strong> (Autoservicio y Atención Personalizada con 2 Cajeros).
            </p>
          </div>

          <button
            onClick={onGoToTimer}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 shrink-0 self-start md:self-auto"
          >
            <span>Ir a Cronómetros</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual System Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canal 1: Tótem */}
        <div className="bg-white rounded-2xl border-2 border-indigo-200/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Canal 1</span>
                <h3 className="text-lg font-black text-slate-900">Cola Tótem ➔ Autoservicio</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Los clientes llegan a la <strong>Cola Tótem</strong> (FIFO). Cuando el Tótem está disponible, el primer cliente pasa al proceso de <strong>Autoservicio</strong>.
            </p>

            <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-100 space-y-2 text-xs">
              <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Características:</span>
              </div>
              <ul className="list-disc list-inside text-indigo-950 space-y-1 pl-1 font-medium">
                <li><strong>Cola Tótem:</strong> Medición del tiempo en cola $W_q$ de cada cliente en orden FIFO.</li>
                <li><strong>Proceso Autoservicio:</strong> Medición del tiempo de atención $W_s$ en la terminal táctil.</li>
                <li><strong>Trámite exclusivo:</strong> Sólo retiro de entradas previamente adquiridas por la app web.</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            <strong>Flujo:</strong> Presiona <em>"+ Llegada a Cola Tótem"</em> al llegar el cliente, y <em>"Pasar a Tótem"</em> cuando inicia su autoservicio.
          </div>
        </div>

        {/* Canal 2: Cajeros */}
        <div className="bg-white rounded-2xl border-2 border-emerald-300/80 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Canal 2</span>
                <h3 className="text-lg font-black text-slate-900">Cola Cajero ➔ 2 Cajeros</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Los clientes forman una única <strong>Cola Cajero</strong> (FIFO). A medida que se liberan, son atendidos por <strong>Cajero 1</strong> o <strong>Cajero 2</strong> en simultáneo.
            </p>

            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100 space-y-2 text-xs">
              <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Distinción de Trámites:</span>
              </div>
              <ul className="list-disc list-inside text-emerald-950 space-y-1 pl-1 font-medium">
                <li><strong>💳 Compra de entradas:</strong> Elección de butacas, forma de pago, emisión de boletos.</li>
                <li><strong>📱 Retiro de entradas (App Web):</strong> Lectura de código digital o DNI para entrega física.</li>
                <li><strong>2 Cajeros simultáneos:</strong> Cajero 1 y Cajero 2 atienden en paralelo.</li>
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
            <strong>Flujo:</strong> Presiona <em>"+ Llegada a Cola Cajero"</em> al llegar. Pasa al primer cajero libre (➔ C1 o ➔ C2), selecciona si compra o retira, y guarda.
          </div>
        </div>
      </div>

      {/* Simulation Advice Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>Guía Metodológica para el Modelo de Simulación</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Tiempos Wq, Ws y W</span>
            <p>
              El software calcula automáticamente el tiempo de espera en cola ($W_q$), tiempo de servicio ($W_s$) y tiempo total en el sistema ($W = W_q + W_s$).
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 block">2. Probabilidad de Bifurcación (p)</span>
            <p>
              En el panel de Registros obtendrás la proporción exacta de clientes que compran entradas vs retiran por la app, para definir el generador aleatorio de tu simulación.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Exportación y Bondad de Ajuste</span>
            <p>
              Exporta el CSV para alimentar tus pruebas Chi-cuadrado / Kolmogorov-Smirnov en Excel, R, Python o InfoStat y modelar las distribuciones de llegadas y atención.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
