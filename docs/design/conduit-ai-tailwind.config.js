/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(16, 55%, 97%)',
            '100': 'hsl(16, 55%, 94%)',
            '200': 'hsl(16, 55%, 86%)',
            '300': 'hsl(16, 55%, 76%)',
            '400': 'hsl(16, 55%, 64%)',
            '500': 'hsl(16, 55%, 50%)',
            '600': 'hsl(16, 55%, 40%)',
            '700': 'hsl(16, 55%, 32%)',
            '800': 'hsl(16, 55%, 24%)',
            '900': 'hsl(16, 55%, 16%)',
            '950': 'hsl(16, 55%, 10%)',
            DEFAULT: '#c65f39'
        },
        secondary: {
            '50': 'hsl(29, 100%, 97%)',
            '100': 'hsl(29, 100%, 94%)',
            '200': 'hsl(29, 100%, 86%)',
            '300': 'hsl(29, 100%, 76%)',
            '400': 'hsl(29, 100%, 64%)',
            '500': 'hsl(29, 100%, 50%)',
            '600': 'hsl(29, 100%, 40%)',
            '700': 'hsl(29, 100%, 32%)',
            '800': 'hsl(29, 100%, 24%)',
            '900': 'hsl(29, 100%, 16%)',
            '950': 'hsl(29, 100%, 10%)',
            DEFAULT: '#dd6b00'
        },
        accent: {
            '50': 'hsl(0, 100%, 97%)',
            '100': 'hsl(0, 100%, 94%)',
            '200': 'hsl(0, 100%, 86%)',
            '300': 'hsl(0, 100%, 76%)',
            '400': 'hsl(0, 100%, 64%)',
            '500': 'hsl(0, 100%, 50%)',
            '600': 'hsl(0, 100%, 40%)',
            '700': 'hsl(0, 100%, 32%)',
            '800': 'hsl(0, 100%, 24%)',
            '900': 'hsl(0, 100%, 16%)',
            '950': 'hsl(0, 100%, 10%)',
            DEFAULT: '#ffdede'
        },
        'neutral-50': '#11100f',
        'neutral-100': '#ffffff',
        'neutral-200': '#595859',
        'neutral-300': '#000000',
        'neutral-400': '#c0c0c0',
        'neutral-500': '#4a4a4a',
        'neutral-600': '#222222',
        'neutral-700': '#e6e6e6',
        'neutral-800': '#a1a1aa',
        'neutral-900': '#d9d9d9',
        background: '#050505',
        foreground: '#000000'
    },
    fontFamily: {
        sans: [
            'Söhne',
            'sans-serif'
        ],
        heading: [
            'sans-serif',
            'sans-serif'
        ],
        body: [
            'Roboto',
            'sans-serif'
        ]
    },
    fontSize: {
        '10': [
            '10px',
            {
                lineHeight: '15px',
                letterSpacing: '-0.15667px'
            }
        ],
        '14': [
            '14px',
            {
                lineHeight: '21px'
            }
        ],
        '24': [
            '24px',
            {
                lineHeight: '36px',
                letterSpacing: '-0.15667px'
            }
        ],
        '70.5016': [
            '70.5016px',
            {
                lineHeight: '77.5517px',
                letterSpacing: '-0.15667px'
            }
        ],
        '54.8345': [
            '54.8345px',
            {
                lineHeight: '63.0597px',
                letterSpacing: '-0.15667px'
            }
        ],
        '43.0843': [
            '43.0843px',
            {
                lineHeight: '51.7011px',
                letterSpacing: '-0.15667px'
            }
        ],
        '35.2508': [
            '35.2508px',
            {
                lineHeight: '44.0635px',
                letterSpacing: '-0.15667px'
            }
        ],
        '19.5838': [
            '19.5838px',
            {
                lineHeight: '29.3756px',
                letterSpacing: '-0.15667px'
            }
        ],
        '17.6254': [
            '17.6254px',
            {
                lineHeight: '26.4381px',
                letterSpacing: '-0.15667px'
            }
        ],
        '15.667': [
            '15.667px',
            {
                lineHeight: 'normal'
            }
        ],
        '13.7086': [
            '13.7086px',
            {
                lineHeight: '20.563px',
                letterSpacing: '-0.15667px'
            }
        ],
        '11.7503': [
            '11.7503px',
            {
                lineHeight: '17.6254px',
                letterSpacing: '2.35005px'
            }
        ]
    },
    spacing: {
        '0': '1px',
        '1': '47px',
        '2': '63px',
        '3': '71px',
        '4': '78px',
        '5': '94px',
        '6': '125px',
        '7': '160px',
        '8': '256px',
        '9': '295px',
        '10': '311px',
        '11': '335px',
        '12': '350px',
        '13': '413px'
    },
    borderRadius: {
        sm: '3px',
        md: '8px',
        lg: '16px',
        xl: '24px',
        full: '100px'
    },
    boxShadow: {
        sm: 'rgba(0, 0, 0, 0.04) 0px 0px 0px 0px',
        md: 'rgba(0, 0, 0, 0.07) -2px 2px 10px 0px',
        lg: 'rgba(0, 0, 0, 0.3) 0px 4.358px 27.238px 0px',
        xl: 'rgba(0, 0, 0, 0) 0px 234px 66px 0px, rgba(0, 0, 0, 0.01) 0px 150px 60px 0px, rgba(0, 0, 0, 0.05) 0px 84px 51px 0px, rgba(0, 0, 0, 0.09) 0px 37px 37px 0px, rgba(0, 0, 0, 0.1) 0px 9px 21px 0px'
    },
    screens: {
        md: '768px',
        lg: '992px'
    },
    transitionDuration: {
        '120': '0.12s',
        '300': '0.3s',
        '400': '0.4s',
        '500': '0.5s'
    },
    transitionTimingFunction: {
        default: 'ease'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '1284.7px'
    }
},
  },
};
