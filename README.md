# Create React Native Init App

Interactive CLI tool to scaffold React Native projects with Clean Architecture.

## Installation & Usage

### The Easiest Way (Automatic)

You can initialize a new project directly without installing the CLI globally:

```bash
npm init react-native-init-app
# or
bun init react-native-init-app
```

### Using npx or bunx

```bash
npx create-react-native-init-app
# or
bunx create-react-native-init-app
```

### Global Installation

If you prefer to have the commands available everywhere:

```bash
npm install -g create-react-native-init-app

# Now you can use the following commands:
rnia
react-native-init-app
```

## Features

- 🆕 **Scaffold** - Create new React Native project from template
- 🧹 **Clean** - Clean caches and build folders (Android, iOS, Node Modules, Watchman)
- 📦 **Pod Install** - Install CocoaPods dependencies
- 🤖 **Run Android** - Run app on Android device/emulator
- 📥 **Downloads template** from GitHub automatically

## Usage

```bash
# Interactive mode
npx create-react-native-init-app

# Short alias (after global install)
rnia
```

## Requirements

- Node.js >= 18.0.0
- Bun (optional, for faster execution)

## Template

The CLI downloads the latest template from:

- GitHub: [CrisangerA/react-native-template](https://github.com/CrisangerA/react-native-template)
- Branch: `main`

## Commands

| Command     | Description                                              |
| ----------- | -------------------------------------------------------- |
| scaffold    | Create new project from template                         |
| clean       | Clean caches (Android, iOS, Node Modules, Watchman, All) |
| pod-install | Install CocoaPods dependencies                           |
| run-android | Run app on Android                                       |
| version     | Show CLI version                                         |
| help        | Show help                                                |

## License

MIT
