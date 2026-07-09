let _n = 0;
export const genId = (p = "id") => `${p}_${(_n++).toString(36)}`;
