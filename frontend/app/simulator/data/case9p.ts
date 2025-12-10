import { MPC } from '../utils/SimulateUtils';

// Sistema de 9 barras (case9p.m)
export const sistema9Barras: MPC = {
  version: '2',
  baseMVA: 100,
  bus: [
    { bus_i: 1, type: 3, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: true },
    { bus_i: 2, type: 2, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: true },
    { bus_i: 3, type: 2, Pd: 70.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: true },
    { bus_i: 4, type: 1, Pd: 50.0, Qd: 0.0, Gs: 0, Bs: 50, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false },
    { bus_i: 5, type: 1, Pd: 90.0, Qd: 30.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false },
    { bus_i: 6, type: 1, Pd: 150.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false },
    { bus_i: 7, type: 1, Pd: 100.0, Qd: 35.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false },
    { bus_i: 8, type: 1, Pd: 0.0, Qd: 0.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false },
    { bus_i: 9, type: 1, Pd: 125.0, Qd: 50.0, Gs: 0, Bs: 0, area: 1, Vm: 1.0, Va: 0.0, baseKV: 345, zone: 1, Vmax: 1.04, Vmin: 0.96, hasGenerator: false }
  ],
  gen: [
    { bus: 1, Pg: 72.3, Qg: 27.03, Qmax: 300, Qmin: -300, Vg: 1.04, mBase: 100, status: 1, Pmax: 250, Pmin: 10 },
    { bus: 2, Pg: 200, Qg: 6.54, Qmax: 300, Qmin: -300, Vg: 1.025, mBase: 100, status: 1, Pmax: 300, Pmin: 10 },
    { bus: 3, Pg: 50, Qg: -10.95, Qmax: 300, Qmin: -300, Vg: 1.025, mBase: 100, status: 1, Pmax: 270, Pmin: 10 }
  ],
  branch: [
    { fbus: 1, tbus: 4, r: 0.0, x: 0.0576, b: 0.5, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 4, tbus: 5, r: 0.017, x: 0.092, b: 0.358, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 5, tbus: 6, r: 0.039, x: 0.17, b: 0.358, rateA: 150, rateB: 150, rateC: 150, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 3, tbus: 6, r: 0.0, x: 0.0586, b: 0.358, rateA: 300, rateB: 300, rateC: 300, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 6, tbus: 7, r: 0.0119, x: 0.1008, b: 0.358, rateA: 150, rateB: 150, rateC: 150, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 7, tbus: 8, r: 0.0085, x: 0.072, b: 0.358, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 8, tbus: 2, r: 0.0, x: 0.0625, b: 0.358, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 8, tbus: 9, r: 0.032, x: 0.161, b: 0.358, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 },
    { fbus: 9, tbus: 4, r: 0.01, x: 0.085, b: 0.358, rateA: 250, rateB: 250, rateC: 250, ratio: 0, angle: 0, status: 1, angmin: -360, angmax: 360, baseMVA: 100 }
  ]
};
