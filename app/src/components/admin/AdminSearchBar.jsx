import { useState, useEffect } from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function AdminSearchBar({ placeholder = "ค้นหา...", onSearch }) {
  const [input, setInput] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearch(input);
    }, 400);
    return () => clearTimeout(timeout);
  }, [input, onSearch]);

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      sx={{ width: 320 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
    />
  );
}
