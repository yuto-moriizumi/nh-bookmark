import DeleteForever from "@mui/icons-material/DeleteForever";
import {
  Card,
  CardActionArea,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Stack,
  Button,
  Rating,
} from "@mui/material";
import { useState } from "react";
import { Modal } from "./Modal";
import { queryClient, client } from ".";
import { useMutation } from "@tanstack/react-query";
import { MutationSnackbar } from "./MutationSnackbar";
import { OptionalSubscription, Subscription } from "../types";

export const DEFAULT_RANK = 3;

type Props = {
  subscription: OptionalSubscription;
};

export const SubscriptionCard = (props: Props) => {
  const { sub_url, image, title, has_new } = props.subscription;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rank, setRank] = useState(props.subscription.rank ?? DEFAULT_RANK);

  const updateSubscription = ({ data }: { data: Subscription }) => {
    queryClient.setQueryData<Subscription[]>(["subscriptions"], (prev = []) =>
      prev.map((s) =>
        s.sub_url === sub_url
          ? { ...s, has_new: data.has_new, rank: data.rank }
          : s,
      ),
    );
  };

  const updateRank = useMutation({
    mutationFn: (rank: number) =>
      client.post<Subscription>("/subscriptions/patch", {
        url: sub_url,
        rank,
      }),
    onSuccess: updateSubscription,
  });
  const updateNew = useMutation({
    mutationFn: (hasNew: boolean) =>
      client.post<Subscription>("/subscriptions/patch", {
        url: sub_url,
        has_new: hasNew,
      }),
    onSuccess: updateSubscription,
  });
  const deleteSubscription = useMutation({
    mutationFn: () => client.post("/subscriptions/delete", { url: sub_url }),
    onSuccess: () => {
      queryClient.setQueryData<OptionalSubscription[]>(
        ["subscriptions"],
        (prev) => (prev ? prev.filter((s) => s.sub_url !== sub_url) : prev),
      );
      setIsModalOpen(false);
    },
  });
  return (
    <>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Stack spacing={1}>
          <Typography variant="h3">本当に削除しますか？</Typography>
          <Button onClick={() => deleteSubscription.mutate()}>Delete</Button>
        </Stack>
      </Modal>
      <MutationSnackbar
        mutation={updateRank}
        message={{
          success: "ランクを更新しました",
          pending: "ランクを更新しています...",
          error: "ランクの更新に失敗しました",
        }}
      />
      <MutationSnackbar
        mutation={updateNew}
        message={{
          success: "既読を更新しました",
          pending: "既読を更新しています...",
          error: "既読を更新に失敗しました",
         }}
       />
       <Card sx={{ height: "100%" }} role="article"> {/* Add role="article" */}
         <CardActionArea href={sub_url}>
           <img
            src={image || ""}
            referrerPolicy="no-referrer"
            alt={sub_url}
            width="100%"
          />
        </CardActionArea>
        <CardContent sx={{ paddingBottom: 0 }}>
          <Typography variant="h5">{title}</Typography>
          <Typography variant="caption">{sub_url}</Typography>
        </CardContent>
        <CardActions disableSpacing>
          <Rating
            value={rank}
            onChange={(_, v) => {
              if (updateRank.isPending) return;
              setRank(v ?? DEFAULT_RANK);
              updateRank.reset();
              updateRank.mutate(v ?? DEFAULT_RANK);
            }}
          />
          <Button
            color={has_new ? "primary" : "secondary"}
            size="small"
            variant="contained"
            onClick={() => {
              if (updateNew.isPending) return;
              updateNew.reset();
              updateNew.mutate(!has_new);
            }}
          >
            {has_new ? "NEW" : "READ"}
          </Button>
          <IconButton onClick={() => setIsModalOpen(true)}>
            <DeleteForever />
          </IconButton>
        </CardActions>
      </Card>
    </>
  );
};
