import express, { json } from "express";
import cors from "cors";
import { SubscriptionModel } from "./model/Subscription";
import { aws } from "dynamoose";
import { validateEnv } from "@volgakurvar/vaidate-env";
import { str } from "envalid";

const app = express();

app.get("/", (_, res) => {
  return res.status(200).json({ message: "Hello from root!" });
});

// ミドルウェア設定
app.use(json());
app.use(cors());

app.use(async (_, res, next) => {
  const env = validateEnv({
    DB_ACCESS_KEY_ID: str(),
    DB_SECRET_ACCESS_KEY: str(),
  });
  if (env instanceof Error) return env;
  const ddb = new aws.ddb.DynamoDB({
    credentials: {
      accessKeyId: env.DB_ACCESS_KEY_ID,
      secretAccessKey: env.DB_SECRET_ACCESS_KEY,
    },
    region: "ap-northeast-1",
  });
  aws.ddb.set(ddb);
  next();
});

app.get("/subscriptions", async (req, res) => {
  const subscriptions = await SubscriptionModel.scan().exec();
  res.status(200).json({ subscriptions });
});

app.post("/subscriptions", async (req, res) => {
  const subscription = new SubscriptionModel(req.body);
  await subscription.save();
  res.status(200).send(subscription);
});

app.post<object, object, { url: string; rank?: number; has_new?: boolean }>(
  "/subscriptions/patch",
  async ({ body }, res) => {
    const subscription = await SubscriptionModel.get(body.url);
    subscription.rank = body.rank ?? subscription.rank;
    subscription.has_new = body.has_new ?? subscription.has_new;
    await subscription.save();
    res.status(200).send(subscription);
  },
);

app.post("/subscriptions/delete", async (req, res) => {
  const subscription = await SubscriptionModel.get(req.body.url);
  await subscription.delete();
  res.status(204).end();
});

app.use((_, res) => {
  return res.status(404).json({ error: "Not Found" });
});

export { app };
