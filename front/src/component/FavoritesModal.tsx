import { Grid, Modal } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionCard } from "./SubscriptionCard";
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

async function update(subscriptions: Subscription[]) {
  // checked_atが古い順にソート
  const sortedData = subscriptions.sort((a, b) => a.checked_at - b.checked_at);
  for (const item of sortedData) {
    // 最後のチェックがSKIP_CHECK_THRESHOLD時間以内の場合は処理を終了
    if (Date.now() - item.checked_at < SKIP_CHECK_THRESHOLD) break;

    const subscription = await updateSubscription(item);
    if (subscription instanceof Error) throw subscription;

    queryClient.setQueryData<Subscription[]>(["subscriptions"], (prev) =>
      prev
        ? prev.map((s) =>
            s.sub_url === subscription.sub_url ? subscription : s,
          )
        : prev,
    );
    await client.post<Subscription>("/subscriptions", subscription);

    await new Promise((resolve) => setTimeout(resolve, UPDATE_INTERVAL_MS));
  }
}

export function FavoritesModal(props: { open: boolean; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: getSubscriptions,
  });
  const [isAutoUpdateInitiated, setIsAutoUpdateInitiated] = useState(false);

  useEffect(() => {
    // Start auto-update only once when data is available
    if (isAutoUpdateInitiated || !data || data.length === 0) return;
    setIsAutoUpdateInitiated(true);
    // Initial call to start the update chain
    update(data);
  }, [data, isAutoUpdateInitiated]); // Dependency array remains the same

  return (
    <Modal {...props} sx={{ overflowY: "scroll" }}>
      <Grid container spacing={1} columns={24}>
        {(data ?? [])
          .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
          .map((s) => (
            <Grid key={s.sub_url} size={{ xs: 24, sm: 8, md: 6, lg: 4, xl: 3 }}>
              <SubscriptionCard subscription={s} />
            </Grid>
          ))}
      </Grid>
    </Modal>
  );
}
