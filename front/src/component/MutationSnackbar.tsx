import { Snackbar } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: UseMutationResult<any, any, any, any>;
  message: {
    success?: string;
    error?: string;
    pending?: string;
  };
};

export const MutationSnackbar = ({ mutation, message }: Props) => {
  if (mutation.isIdle) return null;
  const msg = message[mutation.status];
  return (
    <Snackbar
      open={!!msg}
      autoHideDuration={6000}
      onClose={() =>
        (mutation.isSuccess || mutation.isError) && mutation.reset()
      }
      message={msg}
    />
  );
};
