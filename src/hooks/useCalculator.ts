import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { CircuitData, NodeStage } from '@/types'

export function useCalculator() {
    const [data, setData] = useState<CircuitData[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRectifier, setSelectedRectifier] = useState<string>('')
    const [saving, setSaving] = useState(false)

    // Fetch initial data
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: rows, error } = await supabase
                .from('datos_circuito')
                .select('*')
                .order('id', { ascending: true }) // Order by ID to respect 1,2,3 order

            if (error) throw error
            if (rows) {
                setData(rows)
                // Default to first rectifier found if not set
                if (!selectedRectifier && rows.length > 0) {
                    setSelectedRectifier(rows[0].rectificador)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter data for current rectifier
    const circuitRows = useMemo(() => {
        if (!selectedRectifier) return []
        // Filter and sort by 'nodo' descending (Source is usually highest calculated last? No, logical flow is Backwards (Final -> Source))
        // In the CSV: 
        // 1a: N3 (2+000), N2 (1+000), N1 (0+000). 
        // Logic in HTML was: Node 3 (Final) -> Node 2 -> Node 1 -> Source.
        // So we need to sort by Node Number Descending usually? 
        // Wait, HTML logic:
        // Node 3 (Final) -> Node 2 -> Node 1.
        // CSV '1a': Node 3, Node 2, Node 1.
        // CSV '2ab': Node 4, Node 3, Node 2, Node 1.
        // So usually the highest node number is the "Final" one (furthest from source)?
        // Let's assume Node 1 is closest to source (Abscisa 0+000 or 6+500?).
        // In HTML: Source -> Rc1 -> N1 -> Rc2 -> N2 -> Rc3 -> N3.
        // So N1 is closest to Source. N3 is furthest.
        // Calculation goes Backwards: Start at N3 (Load), calculate V, then move to N2.
        // So we need to process nodes in descending order: 4, 3, 2, 1.

        return data
            .filter(row => row.rectificador === selectedRectifier)
            .sort((a, b) => b.nodo - a.nodo) // 4, 3, 2, 1
    }, [data, selectedRectifier])

    // Calculation Logic
    const results = useMemo(() => {
        if (circuitRows.length === 0) return []

        // Map rows to Stages (mutable for calculation)
        // We iterate from Final Node (highest index) down to Node 1
        // Logic:
        // 1. Determine V_Node based on Max(Ia*Ra, Ib*Rb)
        // 2. Calculate Reos
        // 3. Calculate V_Drop for *incoming* link (from previous node towards this one)
        // Wait, current flow is Source -> N1 -> N2 -> N3.
        // Calculation flow is N3 -> N2 -> N1 -> Source.

        // Let's create a processed array
        // We need to keep previous stage's Voltage and Current (Total)
        // "Previous" in calculation loop is actually "Next" in circuit (further away).
        // Loop starts at Furthest Node (e.g. N3).

        // State to carry over


        // We need to iterate 4 -> 3 -> 2 -> 1
        // But mapped results should probably correspond to the rows.



        // We need a strictly sequential calculation, hard to do in a clean .map()
        // Let's just iterate

        const resultsMap: any[] = []

        // State carrying over from "Right" (Final) to "Left" (Source)
        let Voltage_Right = 0
        let Current_Right = 0 // Current flowing TO the right node
        let Drop_Right = 0    // Drop on the cable GOING to the right node

        // We iterate circuitRows (Sorted Descending: 4, 3, 2, 1)
        for (const row of circuitRows) {
            const Ra = row.ra1 ?? 0
            const Rb = row.ra2 ?? 0
            const Ia = row.i1 ?? 0
            const Ib = row.i2 ?? 0

            // Determine V_Node
            let V_Node = 0

            // If it is the LAST node (Node 4 or 3 depending on system), V is determined by Loads
            // In our sorted list, the first item is the Final Node.
            if (resultsMap.length === 0) {
                const Va = Ia * Ra
                const Vb = Ib * Rb
                V_Node = Math.max(Va, Vb)
            } else {
                // It's an intermediate node.
                // V_Node = V_Right + Drop_Right
                // Wait, Drop_Right represents voltage drop on cable connecting This -> Right.
                // In HTML: V_N3 = V_N4 + V_Drop4.
                // We calculated V_Drop4 in the PREVIOUS iteration step?
                // Let's look at HTML loop:
                // 1. Calc N4 (Final). Get V4. Calc I_N4. Drop4 = I_N4 * Rc4.
                // 2. Calc N3. V3 = V4 + Drop4. Calc I_N3. Drop3 = (I_N3 + I_N4) * Rc3.

                V_Node = Voltage_Right + Drop_Right
            }

            // Calculate Reostats
            const Reo1 = (Ia > 0) ? (V_Node / Ia) - Ra : 0
            const Reo2 = (Ib > 0) ? (V_Node / Ib) - Rb : 0

            // Calculate Output for NEXT step (move left)
            // We need to calculate what the Voltage Drop will be on the cable ENTERING this node (from left)
            // actually, the loop logic in HTML calculates the drop of the cable on the *right* of the current node?
            // No, let's trace:
            // HTML Loop:
            // Loop Node 4: Calc V4. Drop4 = I_Total_4 * Rc4. (Rc4 is cable N3->N4).
            // Loop Node 3: V3 = V4 + Drop4. Drop3 = (I_Total_3 + I_Total_4) * Rc3. (Rc3 is N2->N3).
            // So for the current node `row`, we need to calculate Drop using *its own* Rc?
            // Yes, in CSV, `Rc` for Node 4 is likely Rc4.

            const I_Node_Total = Ia + Ib
            const I_Link_Through = I_Node_Total + Current_Right
            const Rc_ThisNode = row.rc ?? 0

            const V_Drop_ThisCable = I_Link_Through * Rc_ThisNode

            // Store state for next iteration (which is the node to the left)
            Voltage_Right = V_Node
            Current_Right = I_Link_Through
            Drop_Right = V_Drop_ThisCable

            resultsMap.push({
                ...row,
                v: V_Node,
                reo1: Reo1,
                reo2: Reo2,
                // debug info
                drop_next: Drop_Right,
                current_in_link: I_Link_Through
            })
        }

        return resultsMap
    }, [circuitRows])

    // Update Result State
    // We don't update `data` directly to avoid infinite loops, but we provide `results` to UI

    const handleInputChange = (id: number, field: keyof CircuitData, value: number) => {
        setData(prev => prev.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value }
            }
            return row
        }))
    }

    const saveResults = async () => {
        setSaving(true)
        try {
            // Upsert all modified rows
            const updates = results.map(r => ({
                id: r.id,
                rectificador: r.rectificador,
                nodo: r.nodo,
                abscisa: r.abscisa,
                // inputs
                ra1: r.ra1, ra2: r.ra2, rc: r.rc, i1: r.i1, i2: r.i2,
                // outputs
                v: r.v, reo1: r.reo1, reo2: r.reo2
            }))

            const { error } = await supabase.from('datos_circuito').upsert(updates)
            if (error) throw error
            alert('Datos guardados correctamente')
        } catch (e: any) {
            alert('Error al guardar: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    return {
        rectifiers: Array.from(new Set(data.map(d => d.rectificador))),
        selectedRectifier,
        setSelectedRectifier,
        circuitData: [...results].sort((a, b) => b.nodo - a.nodo),
        displayData: [...results].sort((a, b) => a.nodo - b.nodo),
        handleInputChange,
        saveResults,
        loading,
        saving,
        sourceVoltage: (results.length > 0) ? (results.find(r => r.nodo === 1)?.v || 0) + (results.find(r => r.nodo === 1)?.drop_next || 0) : 0, // Approx logic
        // Actually source V = V_N1 + Drop_N1(Rc1).
        // In our loop, for Node 1, `Drop_Right` was calculated as I_Total * Rc1. 
        // And `Voltage_Right` (which becomes V_N1) + `Drop_Right` = Source V? 
        // Wait, in previous loop logic:
        // Iteration N1: V_Node = V_N1. Drop_ThisCable = (I_Total) * Rc1.
        // So Source V = V_N1 + Drop_ThisCable.
        totalCurrent: (results.length > 0) ? (results.find(r => r.nodo === 1)?.current_in_link || 0) : 0
    }
}
