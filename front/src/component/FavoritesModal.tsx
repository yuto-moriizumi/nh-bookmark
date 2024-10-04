import { Fab, Grid, Modal, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionCard } from "./SubscriptionCard";
import RefreshIcon from "@mui/icons-material/Refresh";
import { updateSubscription } from "../util";
import { Subscription, SubscriptionResponce } from "../types";
import { queryClient, client } from ".";
import { useEffect, useState } from "react";

const UPDATE_INTERVAL_MS = 1000;
/** Check once an hour */
const SKIP_CHECK_THRESHOLD = 1000 * 60 * 60;

async function getSubscriptions() {
  const res = await client.get<SubscriptionResponce>("/subscriptions");
  return res.data.subscriptions;
}

const updating = new Set<string>();

async function update(data: Subscription[] | undefined) {
  if (!data) return;
  const minUpdatedAtItem = data
    .filter((i) => !updating.has(i.sub_url))
    .reduce(
      (acc, curr) => (curr.checked_at < acc.checked_at ? curr : acc),
      data[0],
    );
  if (Date.now() - minUpdatedAtItem.checked_at < SKIP_CHECK_THRESHOLD) return;
  updating.add(minUpdatedAtItem.sub_url);
  const subscription = await updateSubscription(minUpdatedAtItem);
  updating.delete(minUpdatedAtItem.sub_url);
  if (subscription instanceof Error) throw subscription;
  queryClient.setQueryData<Subscription[]>(["subscriptions"], (prev) =>
    prev
      ? prev.map((s) => (s.sub_url === subscription.sub_url ? subscription : s))
      : prev,
  );
  return client.post<Subscription>("/subscriptions", subscription);
}

export function FavoritesModal(props: { open: boolean; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });
  const [isAutoUpdateInitiated, setIsAutoUpdateInitiated] = useState(false);
  useEffect(() => {
    if (isAutoUpdateInitiated || !data) return;
    setIsAutoUpdateInitiated(true);
    (async () => {
      for (let i = 0; i < data.length; i++) {
        await update(data);
        await new Promise((resolve) => setTimeout(resolve, UPDATE_INTERVAL_MS));
      }
    })();
  }, [data, isAutoUpdateInitiated]);

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
          onClick={() => update(data)}
        >
          <RefreshIcon />
          <Typography>Update</Typography>
        </Fab>
      </>
    </Modal>
  );
}
