import React from "react";
import { Text, Box } from "ink";
import chalk from "chalk";

interface BadgeProps {
  label: string;
  variant: "info" | "success" | "error" | "warning" | "gray";
}

export const Badge: React.FC<BadgeProps> = ({ label, variant }) => {
  const colors = {
    info: chalk.bgBlue.white.bold,
    success: chalk.bgGreen.black.bold,
    error: chalk.bgRed.white.bold,
    warning: chalk.bgYellow.black.bold,
    gray: chalk.bgGray.white.bold,
  };

  const style = colors[variant];

  return (
    <Box marginRight={1}>
      <Text>{style(` ${label.toUpperCase()} `)}</Text>
    </Box>
  );
};
