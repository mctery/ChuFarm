import { Button } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { exportToCSV } from "../../utils/csvExport";

/**
 * CSV export button.
 *
 * @param {Array} data - row data
 * @param {Array<{ key, label }>} columns - column definitions for CSV
 * @param {string} filename - filename without extension
 */
export default function ExportButton({ data, columns, filename = "export" }) {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<FileDownloadIcon />}
      disabled={!data || data.length === 0}
      onClick={() => exportToCSV(data, columns, filename)}
    >
      Export CSV
    </Button>
  );
}
