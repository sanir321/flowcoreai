// React Theme — extracted from https://conduit.ai/
// Compatible with: Chakra UI, Stitches, Vanilla Extract, or any CSS-in-JS

/**
 * TypeScript type definition for this theme:
 *
 * interface Theme {
 *   colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    neutral50: string;
    neutral100: string;
    neutral200: string;
    neutral300: string;
    neutral400: string;
    neutral500: string;
    neutral600: string;
    neutral700: string;
    neutral800: string;
    neutral900: string;
 *   };
 *   fonts: {
    body: string;
 *   };
 *   fontSizes: {
    '10': string;
    '14': string;
    '24': string;
    '70.5016': string;
    '54.8345': string;
    '43.0843': string;
    '35.2508': string;
    '19.5838': string;
    '17.6254': string;
    '15.667': string;
    '13.7086': string;
    '11.7503': string;
 *   };
 *   space: {
    '1': string;
    '47': string;
    '63': string;
    '71': string;
    '78': string;
    '94': string;
    '125': string;
    '160': string;
    '256': string;
    '295': string;
    '311': string;
    '335': string;
    '350': string;
    '413': string;
 *   };
 *   radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
 *   };
 *   shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
 *   };
 *   states: {
 *     hover: { opacity: number };
 *     focus: { opacity: number };
 *     active: { opacity: number };
 *     disabled: { opacity: number };
 *   };
 * }
 */

export const theme = {
  "colors": {
    "primary": "#c65f39",
    "secondary": "#dd6b00",
    "accent": "#ffdede",
    "background": "#050505",
    "foreground": "#000000",
    "neutral50": "#11100f",
    "neutral100": "#ffffff",
    "neutral200": "#595859",
    "neutral300": "#000000",
    "neutral400": "#c0c0c0",
    "neutral500": "#4a4a4a",
    "neutral600": "#222222",
    "neutral700": "#e6e6e6",
    "neutral800": "#a1a1aa",
    "neutral900": "#d9d9d9"
  },
  "fonts": {
    "body": "'Roboto', sans-serif"
  },
  "fontSizes": {
    "10": "10px",
    "14": "14px",
    "24": "24px",
    "70.5016": "70.5016px",
    "54.8345": "54.8345px",
    "43.0843": "43.0843px",
    "35.2508": "35.2508px",
    "19.5838": "19.5838px",
    "17.6254": "17.6254px",
    "15.667": "15.667px",
    "13.7086": "13.7086px",
    "11.7503": "11.7503px"
  },
  "space": {
    "1": "1px",
    "47": "47px",
    "63": "63px",
    "71": "71px",
    "78": "78px",
    "94": "94px",
    "125": "125px",
    "160": "160px",
    "256": "256px",
    "295": "295px",
    "311": "311px",
    "335": "335px",
    "350": "350px",
    "413": "413px"
  },
  "radii": {
    "sm": "3px",
    "md": "8px",
    "lg": "16px",
    "xl": "24px",
    "full": "100px"
  },
  "shadows": {
    "sm": "rgba(0, 0, 0, 0.04) 0px 0px 0px 0px",
    "md": "rgba(0, 0, 0, 0.07) -2px 2px 10px 0px",
    "lg": "rgba(0, 0, 0, 0.3) 0px 4.358px 27.238px 0px",
    "xl": "rgba(0, 0, 0, 0) 0px 234px 66px 0px, rgba(0, 0, 0, 0.01) 0px 150px 60px 0px, rgba(0, 0, 0, 0.05) 0px 84px 51px 0px, rgba(0, 0, 0, 0.09) 0px 37px 37px 0px, rgba(0, 0, 0, 0.1) 0px 9px 21px 0px"
  },
  "states": {
    "hover": {
      "opacity": 0.08
    },
    "focus": {
      "opacity": 0.12
    },
    "active": {
      "opacity": 0.16
    },
    "disabled": {
      "opacity": 0.38
    }
  }
};

// MUI v5 theme
export const muiTheme = {
  "palette": {
    "primary": {
      "main": "#c65f39",
      "light": "hsl(16, 55%, 65%)",
      "dark": "hsl(16, 55%, 35%)"
    },
    "secondary": {
      "main": "#dd6b00",
      "light": "hsl(29, 100%, 58%)",
      "dark": "hsl(29, 100%, 28%)"
    },
    "background": {
      "default": "#050505",
      "paper": "#ffffff"
    },
    "text": {
      "primary": "#000000",
      "secondary": "#11100f"
    }
  },
  "typography": {
    "fontFamily": "'Roboto', sans-serif",
    "h1": {
      "fontSize": "35.2508px",
      "fontWeight": "400",
      "lineHeight": "44.0635px"
    },
    "h2": {
      "fontSize": "24px",
      "fontWeight": "400",
      "lineHeight": "36px"
    },
    "body1": {
      "fontSize": "19.5838px",
      "fontWeight": "300",
      "lineHeight": "29.3756px"
    }
  },
  "shape": {
    "borderRadius": 8
  },
  "shadows": [
    "rgba(0, 0, 0, 0.04) 0px 0px 0px 0px",
    "rgba(0, 0, 0, 0.07) -2px 2px 10px 0px",
    "rgba(0, 0, 0, 0.15) -4px 4px 20px 10px",
    "rgba(0, 0, 0, 0) 0px 23px 6px 0px, rgba(0, 0, 0, 0.01) 0px 15px 6px 0px, rgba(0, 0, 0, 0.03) 0px 8px 5px 0px, rgba(0, 0, 0, 0.04) 0px 4px 4px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px",
    "rgba(0, 0, 0, 0.03) 0px 4px 25px 0px"
  ]
};

export default theme;
