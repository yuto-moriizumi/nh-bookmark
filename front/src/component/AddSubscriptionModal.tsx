import { Stack, Typography, TextField, Rating, Button } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "./Modal";
import { MutationSnackbar } from "./MutationSnackbar";
import { DEFAULT_RANK } from "./SubscriptionCard";
import { queryClient, client } from ".";
import { updateSubscription } from "../util";
import { OptionalSubscription, Subscription } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
};

export const AddSubscriptionModal = (props: Props) => {
  const [rank, setRate] = useState(DEFAULT_RANK);
  const addSubscription = useMutation({
    mutationFn: async () => {
      const subscription = await updateSubscription({
        sub_url: document.URL,
        rank,
        has_new: true,
        checked_at: Date.now(),
        updated_at: Date.now(),
        image: "",
        name: "",
        title: "",
        work_url: "",
      });
      if (subscription instanceof Error) throw subscription;
      queryClient.setQueryData<OptionalSubscription[]>(
        ["subscriptions"],
        (prev) => (prev ? [...prev, subscription] : prev),
      );
      props.onClose();
      return client.post<Subscription>("/subscriptions", subscription);
    },
  });
  return (
    <>
      <MutationSnackbar
        mutation={addSubscription}
        message={{
          success: "購読を追加しました",
          pending: "購読を追加しています…",
          error: "購読の追加に失敗しました",
        }}
      />
      <Modal open={props.open} onClose={props.onClose}>
        <Stack spacing={1}>
          <Typography variant="h3">新規購読を追加</Typography>
          <TextField
            label="URL"
            value={document.URL}
            InputProps={{
              readOnly: true,
            }}
          />
          <Rating
            value={rank}
            onChange={(_, v) => setRate(v ?? DEFAULT_RANK)}
            getLabelText={(value: number) => `${value}つ星`}
          />
          <Button onClick={() => addSubscription.mutate()}>Submit</Button>
        </Stack>
      </Modal>
    </>
  );
};
