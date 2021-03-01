import { unstable_createMuiStrictModeTheme as createMuiTheme } from "@material-ui/core";

const theme = createMuiTheme({
	palette: {
		type: "dark",
		background: {
			default: "#04080f",
			paper: "#080c13"
		},
		primary: {
			main: "#a4243b"
		},
		secondary: {
			main: "#1b998b"
		}
	},
	typography: {
		fontFamily: "'Open Sans', sans serif",
		h1: {fontFamily: "Monda, sans-serif"},
		h2: {fontFamily: "Monda, sans-serif"},
		h3: {fontFamily: "Monda, sans-serif"},
		h4: {fontFamily: "Monda, sans-serif"},
		h5: {fontFamily: "Monda, sans-serif"},
		h6: {fontFamily: "Monda, sans-serif"}
	}
});

export default theme;