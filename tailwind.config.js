/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", "class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}", // Tremor components
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			},
			// Tremor colors
			tremor: {
				brand: {
					faint: '#eff6ff', // blue-50
					muted: '#bfdbfe', // blue-200
					subtle: '#60a5fa', // blue-400
					DEFAULT: '#3b82f6', // blue-500
					emphasis: '#1d4ed8', // blue-700
					inverted: '#ffffff', // white
				},
				background: {
					muted: '#f9fafb', // gray-50
					subtle: '#f3f4f6', // gray-100
					DEFAULT: '#ffffff', // white
					emphasis: '#374151', // gray-700
				},
				border: {
					DEFAULT: '#e5e7eb', // gray-200
				},
				ring: {
					DEFAULT: '#e5e7eb', // gray-200
				},
				content: {
					subtle: '#9ca3af', // gray-400
					DEFAULT: '#6b7280', // gray-500
					emphasis: '#374151', // gray-700
					strong: '#111827', // gray-900
					inverted: '#ffffff', // white
				},
			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		animation: {
			'typewriter': 'typewriter 2s steps(11) forwards',
			'caret': 'typewriter 2s steps(11) forwards, blink 1s steps(1) infinite 2s',
			'aurora': 'aurora 60s linear infinite',
			'shimmer': 'shimmer 2s linear infinite',
			'float': 'float 3s ease-in-out infinite',
			'glow': 'glow 2s ease-in-out infinite alternate',
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'first': 'moveVertical 30s ease infinite',
			'second': 'moveInCircle 20s reverse infinite',
			'third': 'moveInCircle 40s linear infinite',
			'fourth': 'moveHorizontal 40s ease infinite',
			'fifth': 'moveInCircle 20s ease infinite'
		},
  		keyframes: {
  			typewriter: {
  				to: {
  					left: '100%'
  				}
  			},
  			blink: {
  				'0%': {
  					opacity: '0'
  				},
  				'0.1%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '1'
  				},
  				'50.1%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '0'
  				}
  			},
  			aurora: {
  				from: {
  					backgroundPosition: '50% 50%, 50% 50%'
  				},
  				to: {
  					backgroundPosition: '350% 50%, 350% 50%'
  				}
  			},
  			shimmer: {
  				from: {
  					backgroundPosition: '0 0'
  				},
  				to: {
  					backgroundPosition: '-200% 0'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			glow: {
  				'0%': {
  					boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6'
  				},
  				'100%': {
  					boxShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: '0'
				}
			},
			moveHorizontal: {
				"0%": {
					transform: "translateX(-50%) translateY(-10%)",
				},
				"50%": {
					transform: "translateX(50%) translateY(10%)",
				},
				"100%": {
					transform: "translateX(-50%) translateY(-10%)",
				},
			},
			moveInCircle: {
				"0%": {
					transform: "rotate(0deg)",
				},
				"50%": {
					transform: "rotate(180deg)",
				},
				"100%": {
					transform: "rotate(360deg)",
				},
			},
			moveVertical: {
				"0%": {
					transform: "translateY(-50%)",
				},
				"50%": {
					transform: "translateY(50%)",
				},
				"100%": {
					transform: "translateY(-50%)",
				},
			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		backdropBlur: {
  			xs: '2px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};