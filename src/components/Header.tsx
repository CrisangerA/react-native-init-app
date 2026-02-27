import React from "react";
import { Box, Text } from "ink";
import chalk from "chalk";
import { VERSION } from "../constants.js";

export const Header: React.FC = () => {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="cyan">
          ⚡ Create React Native Init App
        </Text>
        <Text color="gray"> v{VERSION}</Text>
      </Box>
      <Box>
        <Text dimColor italic>
          Clean Architecture Template Generator
        </Text>
      </Box>
      <Text color="gray">
        {"─".repeat(process.stdout.columns || 80)}
      </Text>
    </Box>
  );
};
