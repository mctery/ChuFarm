import { Card, CardContent, Box, Avatar, Typography, Skeleton } from "@mui/material";

export default function StatCard({ icon, label, value, color = "primary.main", loading = false }) {
  return (
    <Card sx={{ flex: 1, minWidth: 180 }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2, "&:last-child": { pb: 2 } }}>
        <Avatar
          sx={{
            bgcolor: color,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
