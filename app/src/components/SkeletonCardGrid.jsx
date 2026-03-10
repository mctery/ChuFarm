import { Grid, Skeleton, Box, Stack } from "@mui/material";

/**
 * Skeleton placeholder that mimics a page with a header + card grid.
 *
 * @param {number} count - number of skeleton cards to render (default: 6)
 * @param {number} height - card skeleton height in px (default: 140)
 */
export default function SkeletonCardGrid({ count = 6, height = 140 }) {
  return (
    <Box sx={{ p: 3 }}>
      {/* Header row skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Skeleton variant="text" width={200} height={36} />
          <Skeleton variant="text" width={140} height={20} />
        </Box>
        <Skeleton variant="rounded" width={120} height={36} />
      </Stack>

      {/* Card grid skeleton */}
      <Grid container spacing={2}>
        {Array.from({ length: count }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={height} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
