import React from "react";
import { Box, Text } from "ink";
import { PROGRESS_BAR_WIDTH } from "../constants.js";

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
}) => {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * PROGRESS_BAR_WIDTH);
  const empty = PROGRESS_BAR_WIDTH - filled;

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan">{label}</Text>
      </Box>
      <Box>
        <Text color="green">{">".repeat(filled)}</Text>
        <Text color="gray">{"-".repeat(empty)}</Text>
        <Text> {percentage}%</Text>
      </Box>
    </Box>
  );
};
