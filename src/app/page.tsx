"use client"

import { useCalculator } from "@/hooks/useCalculator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Activity, Zap, Save, ChevronRight, Settings } from "lucide-react"

export default function Home() {
  const {
    rectifiers,
    selectedRectifier,
    setSelectedRectifier,
    displayData,
    handleInputChange,
    sourceVoltage,
    totalCurrent,
    loading,
    saveResults,
    saving
  } = useCalculator()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-sky-500">
        <Activity className="h-10 w-10 animate-spin" />
        <span className="ml-3 text-xl font-medium">Cargando datos...</span>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Protección Catódica
          </h1>
          <p className="text-slate-400 mt-1">Balanceo de Ánodos Paralelos (Daisy Chain)</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-full border border-slate-800">
          <span className="text-sm font-medium text-slate-400 pl-3">Rectificador:</span>
          <select
            value={selectedRectifier}
            onChange={(e) => setSelectedRectifier(e.target.value)}
            className="bg-slate-800 text-sky-400 font-bold rounded-full px-4 py-1.5 border-none focus:ring-2 focus:ring-sky-500 outline-none"
          >
            {rectifiers.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-sky-900/20 to-emerald-900/20 border-sky-500/30">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex gap-8">
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Voltaje Fuente Req.</p>
                <div className="text-4xl font-bold text-sky-400 mt-2">
                  {sourceVoltage.toFixed(2)} <span className="text-lg text-slate-500">V</span>
                </div>
              </div>
              <div className="h-full w-px bg-slate-700/50 mx-2"></div>
              <div>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Corriente Total</p>
                <div className="text-4xl font-bold text-sky-400 mt-2">
                  {totalCurrent.toFixed(3)} <span className="text-lg text-slate-500">A</span>
                </div>
              </div>
            </div>
            <Zap className="h-12 w-12 text-sky-500 opacity-50" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex flex-col gap-2">
              <Button onClick={saveResults} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">
                {saving ? (
                  <>Guardando...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Guardar Resultados</>
                )}
              </Button>
              <p className="text-xs text-slate-500 mt-1">Actualiza la base de datos Supabase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Source -> nodes */}
      <div className="relative">
        {/* Visual Line connecting cards could go here, but complex in Grid. Simple grid is fine. */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayData.map((node, index) => (
            <Card key={node.id} className="relative overflow-visible">
              {/* Connection Line Visual */}
              {index > 0 && (
                <div className="hidden lg:block absolute top-1/2 -left-6 w-6 h-0.5 bg-slate-700/50 -translate-y-1/2" />
              )}

              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Nodo {node.nodo}</CardTitle>
                    <div className="text-xs font-mono text-emerald-400 mt-1 bg-emerald-950/30 px-2 py-0.5 rounded-full inline-block">
                      {node.abscisa}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">ID:{node.id}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cable Input (Rc entering this node) */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                  <Label className="text-xs text-slate-500 mb-1.5 block">Cable Entrada (Rc)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={node.rc ?? ''}
                      onChange={(e) => handleInputChange(node.id!, 'rc', parseFloat(e.target.value))}
                      className="h-8 text-right font-mono"
                    />
                    <span className="text-slate-500 text-xs">Ω</span>
                  </div>
                </div>

                {/* Stage A */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Ra (A)</Label>
                    <Input
                      type="number"
                      value={node.ra1 ?? ''}
                      onChange={(e) => handleInputChange(node.id!, 'ra1', parseFloat(e.target.value))}
                      className="h-8 text-right font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Ia (A)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={node.i1 ?? ''}
                      onChange={(e) => handleInputChange(node.id!, 'i1', parseFloat(e.target.value))}
                      className="h-8 text-right font-mono mt-1 text-sky-300"
                    />
                  </div>
                </div>

                {/* Stage B */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Rb (B)</Label>
                    <Input
                      type="number"
                      value={node.ra2 ?? ''}
                      onChange={(e) => handleInputChange(node.id!, 'ra2', parseFloat(e.target.value))}
                      className="h-8 text-right font-mono mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-slate-500">Ib (B)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={node.i2 ?? ''}
                      onChange={(e) => handleInputChange(node.id!, 'i2', parseFloat(e.target.value))}
                      className="h-8 text-right font-mono mt-1 text-sky-300"
                    />
                  </div>
                </div>

                {/* Results Box */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reo A:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {node.reo1 ? node.reo1.toFixed(3) : '--'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reo B:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {node.reo2 ? node.reo2.toFixed(3) : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center bg-slate-900 p-2 rounded">
                    <span className="text-xs text-slate-400">Voltaje Nodo</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {node.v ? node.v.toFixed(3) : '--'} V
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
