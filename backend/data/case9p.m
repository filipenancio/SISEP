function mpc = case9p
%   MATPOWER

%% MATPOWER Case Format : Version 2
mpc.version = '2';

%%-----  Power Flow Data  -----%%
%% system MVA base
mpc.baseMVA = 100;

%% bus data
%	bus_i	type	Pd	Qd	Gs	Bs	area	Vm	Va	baseKV	zone	Vmax	Vmin
mpc.bus = [
	1	3	0	0	0	0	1	1	0	345	1	1.04	0.96;
	2	2	0	0	0	0	1	1	0	345	1	1.04	0.96;
	3	2	70	0	0	0	1	1	0	345	1	1.04	0.96;
	4	1	50	0	0	50	1	1	0	345	1	1.04	0.96;
	5	1	90	30	0	0	1	1	0	345	1	1.04	0.96;
	6	1	150	0	0	0	1	1	0	345	1	1.04	0.96;
	7	1	100	35	0	0	1	1	0	345	1	1.04	0.96;
	8	1	0	0	0	0	1	1	0	345	1	1.04	0.96;
	9	1	125	50	0	0	1	1	0	345	1	1.04	0.96;
];

%% generator data
%	bus	Pg	Qg	Qmax	Qmin	Vg	mBase	status	Pmax	Pmin	Pc1	Pc2	Qc1min	Qc1max	Qc2min	Qc2max	ramp_agc	ramp_10	ramp_30	ramp_q	apf
mpc.gen = [
	1	72.3	27.03	300	-300	1.04	100	1	250	10	0	0	0	0	0	0	0	0	0	0	0;
	2	200	6.54	300	-300	1.025	100	1	300	10	0	0	0	0	0	0	0	0	0	0	0;
	3	50	-10.95	300	-300	1.025	100	1	270	10	0	0	0	0	0	0	0	0	0	0	0;
];

%% branch data
%	fbus	tbus	r	x	b	rateA	rateB	rateC	ratio	angle	status	angmin	angmax
mpc.branch = [
	1	4	0	0.0576	0.5	250	250	250	0	0	1	-360	360;
	4	5	0.017	0.092	0.358	250	250	250	0	0	1	-360	360;
	5	6	0.039	0.17	0.358	150	150	150	0	0	1	-360	360;
	3	6	0	0.0586	0.358	300	300	300	0	0	1	-360	360;
	6	7	0.0119	0.1008	0.358	150	150	150	0	0	1	-360	360;
	7	8	0.0085	0.072	0.358	250	250	250	0	0	1	-360	360;
	8	2	0	0.0625	0.358	250	250	250	0	0	1	-360	360;
	8	9	0.032	0.161	0.358	250	250	250	0	0	1	-360	360;
	9	4	0.01	0.085	0.358	250	250	250	0	0	1	-360	360;
];

