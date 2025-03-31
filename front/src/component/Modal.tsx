import { Modal as MuiModal, Container, Paper } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ open, onClose, children }: Props) => (
  <MuiModal open={open} onClose={onClose}>
    <Container
      maxWidth="sm"
      sx={{
        position: "relative",
        top: "50%",
        transform: "translate(0%, -50%)",
      }}
    >
      <Paper sx={{ padding: "1rem" }}>{children}</Paper>
    </Container>
  </MuiModal>
);
