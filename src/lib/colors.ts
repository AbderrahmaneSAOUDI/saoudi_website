export const PRIMARY_COLORS = [
  '#4285F4',
  '#EA4335',
  '#F9AB00',
  '#34A853',

  '#1D3B6C',
  '#254A88',
  '#2C59A3',
  '#3367BE',
  '#3B76D9',

  '#82251D',
  '#9C2D23',
  '#B63429',
  '#D03C2F',

  '#8A5F00',
  '#A67200',
  '#C28500',
  '#DE9800',

  '#174B25',
  '#1D5D2E',
  '#237037',
  '#288341',
  '#2E954A',
];

export const getRandomColor = (): string => {
	return PRIMARY_COLORS[Math.floor(Math.random() * PRIMARY_COLORS.length)];
};
