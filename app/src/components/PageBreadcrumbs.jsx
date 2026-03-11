import { Breadcrumbs, Typography, Link as MuiLink } from "@mui/material";
import { Link as RouterLink } from "react-router";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

/**
 * PageBreadcrumbs
 * @param {Array<{label: string, path?: string}>} crumbs - array of breadcrumb items; last item is current page (no path needed)
 */
export default function PageBreadcrumbs({ crumbs = [], sx }) {
  if (crumbs.length === 0) return null;

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      sx={{ mb: 2, fontSize: "0.85rem", ...sx }}
    >
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        if (isLast || !crumb.path) {
          return (
            <Typography
              key={idx}
              variant="body2"
              color={isLast ? "text.primary" : "text.secondary"}
              fontWeight={isLast ? 600 : 400}
            >
              {crumb.label}
            </Typography>
          );
        }
        return (
          <MuiLink
            key={idx}
            component={RouterLink}
            to={crumb.path}
            underline="hover"
            color="text.secondary"
            variant="body2"
          >
            {crumb.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}
