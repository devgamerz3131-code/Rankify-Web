import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Zap, Play, RotateCcw } from 'lucide-react';

interface FormulaVisualSimulationProps {
  type: 'drift_velocity' | 'nernst_cell' | 'matrix_inverse' | 'rc_circuit';
}

export const FormulaVisualSimulation: React.FC<FormulaVisualSimulationProps> = ({ type }) => {
  // Drift velocity simulation controls
  const [electricField, setElectricField] = useState(2.0); // V/m
  const [temperature, setTemperature] = useState(300); // Kelvin

  // Nernst cell controls
  const [zincConcentration, setZincConcentration] = useState(0.01); // M
  const [copperConcentration, setCopperConcentration] = useState(1.0); // M

  if (type === 'drift_velocity') {
    // Calculated drift speed ~ E / T
    const calculatedVd = ((electricField * 0.05) / (temperature / 300)).toFixed(3);

    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-purple-500/30 text-white space-y-4 text-xs select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono font-bold text-purple-300 uppercase text-[11px]">
              Microscopic Electron Drift Simulator
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-bold text-xs">
            vd ≈ {calculatedVd} mm/s
          </span>
        </div>

        {/* Canvas / Visual Box */}
        <div className="relative h-32 rounded-2xl bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center p-2">
          {/* Wire boundaries */}
          <div className="absolute top-2 bottom-2 left-0 right-0 border-y border-dashed border-purple-400/40 pointer-events-none" />

          {/* Copper Lattice Ions (vibrating) */}
          <div className="absolute inset-0 flex items-center justify-around px-4 pointer-events-none opacity-40">
            {[1, 2, 3, 4, 5, 6].map((ion) => (
              <motion.div
                key={ion}
                animate={{
                  x: [0, (temperature - 300) * 0.05, 0, -(temperature - 300) * 0.05, 0],
                  y: [0, (temperature - 300) * 0.05, 0, -(temperature - 300) * 0.05, 0],
                }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="w-5 h-5 rounded-full bg-amber-600 border border-amber-400 flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
              >
                Cu²⁺
              </motion.div>
            ))}
          </div>

          {/* Drifting Electrons moving left to right */}
          <div className="absolute inset-0 flex flex-col justify-around py-3 overflow-hidden pointer-events-none">
            {[1, 2, 3, 4].map((row) => (
              <motion.div
                key={row}
                animate={{ x: [-50, 420] }}
                transition={{
                  repeat: Infinity,
                  duration: Math.max(0.6, 5 / Math.max(0.5, electricField)),
                  ease: 'linear',
                  delay: row * 0.3,
                }}
                className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/60 flex items-center justify-center text-[8px] text-slate-950 font-black"
              >
                e⁻
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 text-center font-mono text-[11px] text-purple-200/80 bg-black/60 px-3 py-1 rounded-xl backdrop-blur-xs">
            Electric Field ➔ Exerts Force F = -eE opposite to Field
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Applied Voltage / E-Field</span>
              <span className="text-cyan-400 font-bold">{electricField} V/m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={electricField}
              onChange={(e) => setElectricField(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Temperature (Lattice Vibrations)</span>
              <span className="text-amber-400 font-bold">{temperature} K</span>
            </div>
            <input
              type="range"
              min="200"
              max="600"
              step="25"
              value={temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'nernst_cell') {
    // Calculated EMF = 1.10 - 0.02955 * log10(Zn / Cu)
    const ratio = zincConcentration / copperConcentration;
    const logQ = Math.log10(ratio);
    const calculatedEmf = (1.10 - 0.02955 * logQ).toFixed(3);

    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-purple-500/30 text-white space-y-4 text-xs select-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono font-bold text-purple-300 uppercase text-[11px]">
              Daniell Cell EMF Potential Generator
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-bold text-sm">
            Ecell = {calculatedEmf} V
          </span>
        </div>

        {/* Visual Galvanic Setup */}
        <div className="h-28 rounded-2xl bg-slate-950 border border-white/10 p-3 flex items-center justify-between gap-4 font-mono">
          {/* Anode beaker */}
          <div className="flex-1 h-full rounded-xl bg-amber-950/40 border border-amber-500/30 p-2 flex flex-col justify-between text-center">
            <span className="text-[10px] text-amber-300 font-bold uppercase">Anode (Zn)</span>
            <div className="text-xs text-amber-200">Zn²⁺: {zincConcentration} M</div>
            <span className="text-[9px] text-muted-foreground">Oxidation: Zn → Zn²⁺ + 2e⁻</span>
          </div>

          {/* Wire & Voltmeter */}
          <div className="text-center space-y-1">
            <div className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-black shadow-md">
              {calculatedEmf} V
            </div>
            <span className="text-[9px] text-purple-300 block">Salt Bridge</span>
          </div>

          {/* Cathode beaker */}
          <div className="flex-1 h-full rounded-xl bg-cyan-950/40 border border-cyan-500/30 p-2 flex flex-col justify-between text-center">
            <span className="text-[10px] text-cyan-300 font-bold uppercase">Cathode (Cu)</span>
            <div className="text-xs text-cyan-200">Cu²⁺: {copperConcentration} M</div>
            <span className="text-[9px] text-muted-foreground">Reduction: Cu²⁺ + 2e⁻ → Cu</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Anode [Zn²⁺] Concentration</span>
              <span className="text-amber-400 font-bold">{zincConcentration} M</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="2.0"
              step="0.01"
              value={zincConcentration}
              onChange={(e) => setZincConcentration(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">Cathode [Cu²⁺] Concentration</span>
              <span className="text-cyan-400 font-bold">{copperConcentration} M</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="2.0"
              step="0.01"
              value={copperConcentration}
              onChange={(e) => setCopperConcentration(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};
