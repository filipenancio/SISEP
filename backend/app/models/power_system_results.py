from pydantic import BaseModel
from typing import List, Optional

class BusResult(BaseModel):
    bus_id: int
    vm_pu: float  # Mudado de Vm para vm_pu para manter consistência
    va_degree: float  # Mudado de Va para va_degree para manter consistência
    p_mw: float
    q_mvar: float

class LineResult(BaseModel):
    from_bus: int
    to_bus: int
    p_from_mw: float
    q_from_mvar: float
    p_to_mw: float
    q_to_mvar: float
    pl_mw: float
    ql_mvar: float
    i_from_ka: float
    i_to_ka: float
    i_ka: float
    vm_from_pu: float
    va_from_degree: float
    vm_to_pu: float
    va_to_degree: float
    loading_percent: float
    in_service: bool

class LoadResult(BaseModel):
    bus_id: int
    p_mw: float
    q_mvar: float
    scaling: float

class GeneratorResult(BaseModel):
    bus_id: int
    p_mw: float
    q_mvar: float
    vm_pu: float  # Mudado de Vm para vm_pu
    in_service: bool

class ExtGridResult(BaseModel):
    bus_id: int
    p_mw: float
    q_mvar: float
    vm_pu: float

class PowerSystemResult(BaseModel):
    buses: List[BusResult]
    lines: List[LineResult]
    loads: Optional[List[LoadResult]] = []
    generators: Optional[List[GeneratorResult]] = []
    ext_grid: Optional[ExtGridResult] = None
    genCapacityP: Optional[float] = 0.0      # Capacidade total dos geradores - Potência Ativa (P_max)
    genCapacityQmin: Optional[float] = 0.0   # Capacidade total dos geradores - Potência Reativa Mínima (Q_min)
    genCapacityQmax: Optional[float] = 0.0   # Capacidade total dos geradores - Potência Reativa Máxima (Q_max)
    loadSystemP: Optional[float] = 0.0       # Carga total ativa do sistema (P)
    loadSystemQ: Optional[float] = 0.0       # Carga total reativa do sistema (Q)
    iterations: Optional[int] = 0            # Número de iterações do algoritmo
    execution_time_s: Optional[float] = 0.0  # Tempo de execução em segundos
    algorithm: Optional[str] = 'nr'          # Algoritmo utilizado (nr, fdxb, fdbx, bfsw, gs, dc)
