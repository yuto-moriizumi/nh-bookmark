import { Button } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Add from "@mui/icons-material/Add";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import { FavoritesModal } from "./FavoritesModal";

export const queryClient = new QueryClient();

export function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <Main />
    </QueryClientProvider>
  );
}

function Main() {
  const [isFavModalOpen, setFavModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const h1 = document.getElementsByTagName("h1").item(0);
  return (
    <>
      <Button onClick={() => setFavModalOpen(!isFavModalOpen)}>
        Favorites
      </Button>
      {createPortal(
        <FavoritesModal
          open={isFavModalOpen}
          onClose={() => setFavModalOpen(false)}
        />,
        document.body,
      )}
      {h1 &&
        createPortal(
          <Button onClick={() => setAddModalOpen(true)}>
            <Add />
          </Button>,
          h1,
        )}
      {createPortal(
        <AddSubscriptionModal
          open={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
        />,
        document.body,
      )}
    </>
  );
}

export const client = axios.create({
  baseURL: "https://63bft8o202.execute-api.ap-northeast-1.amazonaws.com",
});
