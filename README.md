# React Native Init App

Interactive CLI tool to scaffold React Native projects with Clean Architecture.

## Installation

### Using npx (recommended)

```bash
npx react-native-init-app
```

### Using bunx

```bash
bunx react-native-init-app
```

### Using npm

```bash
npm create react-native-init-app
```

### Using the short alias

```bash
rnia
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
npx react-native-init-app

# Short alias
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
