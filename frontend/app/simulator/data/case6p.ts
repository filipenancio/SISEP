import { MPC } from '../utils/SimulateUtils';

// Sistema de 6 barras (case6p.m)
export const sistema6Barras: MPC = {
  version: '2',
  baseMVA: 100,
  bus: [
    { bus_i: 1, type: 3, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.05, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: true },
    { bus_i: 2, type: 2, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.05, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: true },
    { bus_i: 3, type: 2, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.07, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: true },
    { bus_i: 4, type: 1, Pd: 70.0, Qd: 70.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: false },
    { bus_i: 5, type: 1, Pd: 140.0, Qd: 70.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: false },
    { bus_i: 6, type: 1, Pd: 70.0, Qd: 70.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 230, zone: 1, Vmax: 1.05, Vmin: 0.95, hasGenerator: false }
  ],
  gen: [
    { bus: 1, Pg: 0, Qg: 0, Qmax: 100, Qmin: -100, Vg: 1.00, mBase: 100, status: 1, Pmax: 200, Pmin: 50 },
    { bus: 2, Pg: 50, Qg: 0, Qmax: 100, Qmin: -100, Vg: 1.00, mBase: 100, status: 1, Pmax: 150, Pmin: 37.5 },
    { bus: 3, Pg: 50, Qg: 0, Qmax: 100, Qmin: -100, Vg: 1.07, mBase: 100, status: 1, Pmax: 180, Pmin: 45 }
  ],
  branch: [
    { fbus: 1, tbus: 2, r: 0.1, x: 0.2, b: 0.04, rateA: 40, rateB: 40, rateC: 40, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 1, tbus: 4, r: 0.05, x: 0.2, b: 0.04, rateA: 60, rateB: 60, rateC: 60, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 1, tbus: 5, r: 0.08, x: 0.3, b: 0.06, rateA: 40, rateB: 40, rateC: 40, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 2, tbus: 3, r: 0.05, x: 0.25, b: 0.06, rateA: 40, rateB: 40, rateC: 40, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 2, tbus: 4, r: 0.05, x: 0.1, b: 0.02, rateA: 60, rateB: 60, rateC: 60, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 2, tbus: 5, r: 0.1, x: 0.3, b: 0.04, rateA: 30, rateB: 30, rateC: 30, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 2, tbus: 6, r: 0.07, x: 0.2, b: 0.05, rateA: 90, rateB: 90, rateC: 90, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 3, tbus: 5, r: 0.12, x: 0.26, b: 0.05, rateA: 70, rateB: 70, rateC: 70, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 3, tbus: 6, r: 0.02, x: 0.1, b: 0.02, rateA: 80, rateB: 80, rateC: 80, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 4, tbus: 5, r: 0.2, x: 0.4, b: 0.08, rateA: 20, rateB: 20, rateC: 20, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 5, tbus: 6, r: 0.1, x: 0.3, b: 0.06, rateA: 40, rateB: 40, rateC: 40, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 }
  ]
};
