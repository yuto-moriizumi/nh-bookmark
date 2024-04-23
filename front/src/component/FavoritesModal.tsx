import { Fab, Grid, Modal, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionCard } from "./SubscriptionCard";
import RefreshIcon from "@mui/icons-material/Refresh";
import { updateSubscription } from "../util";
import { Subscription, SubscriptionResponce } from "../types";
import { queryClient, client } from ".";

async function getSubscriptions() {
  const res = await client.get<SubscriptionResponce>("/subscriptions");
  return res.data.subscriptions;
}

export function FavoritesModal(props: { open: boolean; onClose: () => void }) {
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
            return client.post<Subscription>("/subscriptions", subscription);
          }}
        >
          <RefreshIcon />
          <Typography>Update</Typography>
        </Fab>
      </>
    </Modal>
  );
}
