import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  LinearProgress,
  Typography,
  Stack,
} from "@mui/material";

/**
 * Reusable admin data table with pagination.
 *
 * @param {Array} columns - [{ id, label, align?, width?, minWidth? }]
 * @param {Array} rows - data array
 * @param {Function} renderRow - (row, index) => <TableRow>
 * @param {{ page, limit, total }} pagination
 * @param {Function} onPageChange - (newPage) => void  (1-based)
 * @param {Function} onRowsPerPageChange - (newLimit) => void
 * @param {boolean} loading
 * @param {string} emptyText
 * @param {boolean} stickyHeader
 * @param {"small"|"medium"} size
 */
export default function AdminDataTable({
  columns = [],
  rows = [],
  renderRow,
  pagination = { page: 1, limit: 10, total: 0 },
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  emptyText = "ไม่พบข้อมูล",
  stickyHeader = true,
  size = "small",
}) {
  return (
    <TableContainer component={Paper} variant="outlined" sx={stickyHeader ? { maxHeight: 600 } : undefined}>
      {loading && <LinearProgress />}
      <Table size={size} stickyHeader={stickyHeader}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                align={col.align || "left"}
                sx={{
                  fontWeight: 600,
                  bgcolor: "background.paper",
                  ...(col.width && { width: col.width }),
                  ...(col.minWidth && { minWidth: col.minWidth }),
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => renderRow(row, index))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Stack alignItems="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{emptyText}</Typography>
                </Stack>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={pagination.limit}
        onRowsPerPageChange={(e) =>
          onRowsPerPageChange(parseInt(e.target.value, 10))
        }
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="แสดง:"
      />
    </TableContainer>
  );
}
