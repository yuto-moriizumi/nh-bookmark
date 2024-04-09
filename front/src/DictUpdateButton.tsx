import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { queryClient } from "./main";

export function DictUpdateButton() {
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      axios.post(
        "https://1thrt62esf.execute-api.ap-northeast-1.amazonaws.com/glossaries",
      ),
    onSuccess: () => alert("辞書を更新しました"),
    onError: () => alert("辞書の更新に失敗しました"),
    // onSettled is called after onSuccess or onError, to eplicitly show the translation is updated
    onSettled: () => queryClient.resetQueries({ queryKey: ["translation"] }),
  });
  return (
    <button onClick={() => mutate()} disabled={isPending}>
      辞書更新
    </button>
  );
}
