export type SubscriptionResponce = { subscriptions: Subscription[] };
export type OptionalSubscription = Partial<Subscription> &
  Pick<Subscription, "sub_url">;

export type Subscription = {
  sub_url: string;
  work_url: string;
  /** 最新の作品名 */
  title: string;
  image: string;
  updated_at: number;
  checked_at: number;
  /** 作者名 */
  name: string;
  rank: number;
  has_new: boolean;
};
