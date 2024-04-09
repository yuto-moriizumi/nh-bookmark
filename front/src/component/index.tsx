import { Button, Fab, Grid, Modal, Typography } from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { createPortal } from "react-dom";
import { SubscriptionCard } from "./SubscriptionCard";
import axios from "axios";
import Add from "@mui/icons-material/Add";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import RefreshIcon from "@mui/icons-material/Refresh";
import { updateSubscription } from "../util";

export const queryClient = new QueryClient();

export function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <Main />
    </QueryClientProvider>
  );
}

function Main() {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(!open)}>Favorites</Button>
      {createPortal(
        <FavoritesModal open={open} onClose={() => setOpen(false)} />,
        document.body,
      )}
      {createPortal(
        <Button onClick={() => setOpen2(true)}>
          <Add />
        </Button>,
        document.getElementsByTagName("h1").item(0)!,
      )}
      {createPortal(
        <AddSubscriptionModal open={open2} onClose={() => setOpen2(false)} />,
        document.body,
      )}
    </>
  );
}

function FavoritesModal(props: { open: boolean; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });
  return (
    <Modal {...props} sx={{ overflowY: "scroll" }}>
      <>
        <Grid container spacing={1} columns={24}>
          {(data ?? [])
            .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
            .map((s) => (
              <Grid item key={s.sub_url} xs={24} sm={8} md={6} lg={4} xl={3}>
                <SubscriptionCard subscription={s} />
              </Grid>
            ))}
        </Grid>
        <Fab
          variant="extended"
          color="primary"
          sx={{
            position: "fixed",
            bottom: "5px",
            right: "5px",
          }}
          onClick={async () => {
            if (!data) return;
            const minUpdatedAtItem = data.reduce(
              (acc, curr) => (curr.checked_at < acc.checked_at ? curr : acc),
              data[0],
            );
            const subscription = await updateSubscription(minUpdatedAtItem);
            if (subscription instanceof Error) throw subscription;
            queryClient.setQueryData<Subscription[]>(
              ["subscriptions"],
              (prev) =>
                prev
                  ? [
                      ...prev.filter((s) => s.sub_url !== subscription.sub_url),
                      subscription,
                    ]
                  : prev,
            );
            return lambdaClient.post<Subscription>(
              "/subscriptions",
              subscription,
            );
          }}
        >
          <RefreshIcon />
          <Typography>Update</Typography>
        </Fab>
      </>
    </Modal>
  );
}
export const vercelClient = axios.create({
  baseURL: "https://63bft8o202.execute-api.ap-northeast-1.amazonaws.com",
});
export const lambdaClient = vercelClient;

export const getSubscriptions = () =>
  vercelClient
    .get<SubscriptionResponce>("/subscriptions")
    .then((res) => res.data.subscriptions);

export type SubscriptionResponce = { subscriptions: Subscription[] };
export type OptionalSubscription = Partial<Subscription> &
  Pick<Subscription, "sub_url">;

export type Subscription = {
  sub_url: string;
  work_url: string;
  title: string;
  image: string;
  updated_at: number;
  checked_at: number;
  name: string;
  rank: number;
  has_new: boolean;
};
