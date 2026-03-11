import { Box, Typography, Button } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import SearchOffIcon from "@mui/icons-material/SearchOff";

export default function EmptyState({
  icon,
  title = "ไม่มีข้อมูล",
  description,
  action,
  variant = "page",
  sx,
}) {
  const isPage = variant === "page";
  const DefaultIcon = variant === "search" ? SearchOffIcon : InboxIcon;
  const IconComponent = icon || DefaultIcon;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: isPage ? 6 : 4,
        border: isPage ? "2px dashed" : "none",
        borderColor: "divider",
        borderRadius: 3,
        color: "text.secondary",
        ...sx,
      }}
    >
      <Box
        sx={{
          fontSize: isPage ? 64 : 48,
          color: "text.disabled",
          mb: 2,
          lineHeight: 1,
          "& .MuiSvgIcon-root": { fontSize: "inherit" },
        }}
      >
        <IconComponent sx={{ fontSize: "inherit" }} />
      </Box>
      <Typography variant={isPage ? "h6" : "subtitle1"} fontWeight={600} mb={description ? 0.5 : 0}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" mb={action ? 2 : 0}>
          {description}
        </Typography>
      )}
      {action && (
        <Box mt={description ? 0 : 2}>
          {action}
        </Box>
      )}
    </Box>
  );
}
