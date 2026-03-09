/**
 * Export data to CSV file with BOM for Thai character support.
 *
 * @param {Array<Object>} data - array of row objects
 * @param {Array<{ key: string, label: string }>} columns - column definitions
 * @param {string} filename - file name without extension
 */
export function exportToCSV(data, columns, filename = "export") {
  if (!data || data.length === 0) return;

  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  // BOM for Excel to recognize UTF-8 (Thai characters)
  const BOM = "\uFEFF";
  const csv = BOM + [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
