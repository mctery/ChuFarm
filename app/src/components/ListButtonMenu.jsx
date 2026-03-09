import { useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import {
  Button,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

// Styled Menu
const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    transformOrigin={{ vertical: "top", horizontal: "right" }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[8],
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity
        ),
      },
    },
  },
}));

/**
 * @typedef {{
 *   key: string;
 *   name?: string;
 *   icon?: React.ReactNode;
 *   divider?: boolean;
 *   onClick?: () => void;
 * }} MenuItemType
 */

/**
 * @param {{
 *   options?: { name?: string; icon?: React.ReactNode };
 *   listItems: MenuItemType[];
 * }} props
 */
export default function ListButtonMenu({ options = {}, listItems = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleItemClick = (item) => {
    item.onClick?.();
    handleClose();
  };

  return (
    <div>
      <Button
        id="menu-button"
        aria-controls={open ? "menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        variant="contained"
        disableElevation
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        size="small"
      >
        {options.icon} {options.name || "Options"}
      </Button>

      <StyledMenu
        id="menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "menu-button",
          },
        }}
      >
        {listItems.map((item, index) =>
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 0.5 }} />
          ) : (
            <MenuItem key={item.key} onClick={() => handleItemClick(item)} disableRipple>
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText>{item.name}</ListItemText>
            </MenuItem>
          )
        )}
      </StyledMenu>
    </div>
  );
}
