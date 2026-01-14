# 📖 RSVP Speed Reader

A modern web application for speed reading using the **Rapid Serial Visual Presentation (RSVP)** technique. Built with React, TypeScript, and Vite.

## 🌟 Features

### Core Functionality
- ✅ **RSVP Playback** - Display one word at a time in a fixed position
- ✅ **ORP Highlighting** - Optimal Recognition Point highlighting for improved focus
- ✅ **Adaptive Timing** - Intelligent word duration based on length and punctuation
- ✅ **Playback Controls** - Play, pause, reset, and navigation controls
- ✅ **Speed Control** - Adjustable WPM (100-1000) with preset speeds
- ✅ **Progress Tracking** - Visual progress bar with seek functionality

### Customization
- 🎨 **Theme Settings** - Light/dark mode support
- 🔤 **Font Options** - Multiple font families including dyslexia-friendly options
- 🎯 **ORP Color** - Customizable highlight color
- ⚙️ **Timing Configuration** - Adjustable adaptive timing factors

### Accessibility
- ⌨️ **Keyboard Shortcuts**
  - `Space` - Play/Pause
  - `←` - Jump backward 10 words
  - `→` - Jump forward 10 words
  - `Esc` - Reset to beginning
- 📱 **Responsive Design** - Works on desktop and mobile
- ♿ **High Contrast** - Accessible color schemes

## 🚀 Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── WordDisplay.tsx      # Main word display with ORP
│   ├── PlaybackControls.tsx # Playback control buttons
│   ├── SpeedControl.tsx     # WPM adjustment
│   ├── TextInput.tsx        # Text input area
│   ├── ProgressBar.tsx      # Progress indicator
│   └── Settings.tsx         # Settings panel
├── hooks/              # Custom React hooks
│   ├── useRSVPEngine.ts     # Core RSVP engine logic
│   └── useKeyboardShortcuts.ts # Keyboard event handling
├── utils/              # Utility functions
│   └── textProcessor.ts     # Tokenization and timing
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🎯 How It Works

### RSVP Technique
RSVP (Rapid Serial Visual Presentation) displays text one word at a time in a fixed position, eliminating the need for eye movement and potentially increasing reading speed by 2-3x.

### Optimal Recognition Point (ORP)
The ORP is the ideal character position within a word for optimal recognition. This app highlights the ORP to help your eyes focus on the right spot, typically around 30-40% into the word.

### Adaptive Timing
Word display duration is automatically adjusted based on:
- **Word length**: Longer words get more time
- **Punctuation**: Commas, periods add pauses
- **Paragraph breaks**: Extended pauses between paragraphs

#### Default Timing Factors:
```typescript
Length ≤ 4 chars:    1.0×
Length 5-7 chars:    1.1×
Length 8-10 chars:   1.25×
Length > 10 chars:   1.4×

Comma (,):          +0.3×
Period (.) / ! / ?: +0.6×
Paragraph break:    +2.0×
```

## 🛠️ Technical Details

### Performance
- **Precise Timing**: Uses `requestAnimationFrame` for stable, sub-millisecond timing
- **< 16ms Renders**: Optimized for 60fps performance
- **No Data Transmission**: Completely client-side, privacy-first

### State Management
- React hooks for local state
- Refs for precise timing without re-renders
- Minimal re-renders for optimal performance

### Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)

## 📝 Usage Tips

1. **Paste Your Text**: Use the text input area or load the sample text
2. **Adjust Speed**: Start at 200-250 WPM and gradually increase
3. **Find Your ORP Color**: Choose a color that's comfortable for your eyes
4. **Use Keyboard Shortcuts**: Master the shortcuts for smooth control
5. **Take Breaks**: Rest your eyes every 20 minutes

## 🔮 Future Enhancements

- [ ] PDF import
- [ ] Web article reader mode
- [ ] Save/load reading sessions
- [ ] Reading statistics
- [ ] Comprehension checks
- [ ] Mobile haptics
- [ ] PWA support for offline use

## 📄 License

MIT

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
