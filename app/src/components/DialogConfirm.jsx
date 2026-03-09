import React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";

export default function DialogConfirm({
  open,
  handleClose,
  handleConfirm,
  title,
  content,
  loading = false,
  confirmText = "ตกลง",
  cancelText = "ยกเลิก",
  confirmColor = "success",
}) {
  const onClose = () => {
    if (!loading) handleClose();
  };

  const onConfirm = () => {
    handleConfirm();
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="text"
          size="small"
          onClick={onClose}
          color="inherit"
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onConfirm}
          autoFocus
          color={confirmColor}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
