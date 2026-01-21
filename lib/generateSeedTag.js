const batchCodes = {
  0: "B01",
  1: "B02",
  2: "B03",
  3: "B04",
  4: "B05",
  5: "B06",
  6: "B07",
  7: "B08",
  8: "B09",
  9: "B10",
  10: "B11",
  11: "B12",
};

export function generateSeedTag({ name, datePlanted }) {
  const cropCode = name.substring(0, 3).toUpperCase();

  const d = new Date(datePlanted);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `PRB-${cropCode}-${yy}-${mm}-${dd}-${batchCodes[d.getMonth()]}`;
}
