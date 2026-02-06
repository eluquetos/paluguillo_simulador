export interface CircuitData {
    id?: number
    rectificador: string
    nodo: number
    abscisa: string
    ra1: number | null
    ra2: number | null
    rc: number | null
    i1: number | null
    i2: number | null
    v: number | null
    reo1: number | null // Result
    reo2: number | null // Result
    created_at?: string
}

export interface NodeStage {
    id: number // Node Number (1, 2, 3...)
    abscisa: string
    Ra: number // Ra1 / R(n)a
    Rb: number // Ra2 / R(n)b
    Ia: number // I1
    Ib: number // I2

    // Results
    ReoA?: number
    ReoB?: number
    V_Node?: number

    // Interconnection (Input to this node from Source/Prev)
    Rc_In: number // Rc associated with the cable arriving at this node
    V_Drop_In?: number // Voltage drop on the cable arriving at this node
}
