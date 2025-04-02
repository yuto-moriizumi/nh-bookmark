// 重複したインポートを削除し、必要なものを整理
import { describe, it, expect, vi, beforeEach, Mock } from "vitest"; // Mock をインポート
import request from "supertest";
import { app } from "../index"; // テスト対象のExpressアプリ
import { SubscriptionModel, Subscription } from "../model/Subscription"; // Subscription 型をインポート
import { validateEnv } from "@volgakurvar/vaidate-env";
import type { InputKey } from "dynamoose/dist/General"; // InputKey を再度インポート

// dynamoose と validateEnv をモック
vi.mock("../model/Subscription");
vi.mock("@volgakurvar/vaidate-env");

// モックされた validateEnv が成功した環境変数を返すように設定
const mockValidateEnv = vi.mocked(validateEnv);
mockValidateEnv.mockReturnValue({
  DB_ACCESS_KEY_ID: "mock_access_key",
  DB_SECRET_ACCESS_KEY: "mock_secret_key",
});

// SubscriptionModel のモック実装
const mockSubscriptionModel = vi.mocked(SubscriptionModel);
// vi.fn の型引数を削除
const mockScanExec = vi.fn();
const mockSave = vi.fn();
const mockDelete = vi.fn();

// モックインスタンスの型定義を調整 (Subscription のプロパティ + モックメソッド)
// checked_at をオプショナルにする
type MockSubscriptionInstance = Partial<
  Omit<Subscription, "save" | "delete">
> & {
  save: typeof mockSave;
  delete: typeof mockDelete;
  // 他の Item メソッド (toJSON など) は必要に応じてモックを追加
};

// モックインスタンスの初期値 (checked_at を追加)
const mockSubscriptionInstance: MockSubscriptionInstance = {
  sub_url: "",
  work_url: "",
  title: "",
  image: "",
  updated_at: 0,
  checked_at: undefined, // オプショナル
  name: "",
  rank: 0,
  has_new: false,
  save: mockSave,
  delete: mockDelete,
};

// SubscriptionModel の静的メソッドとコンストラクタをモック
// Scan<Subscription> 型との互換性のために unknown を経由
mockSubscriptionModel.scan.mockReturnValue({
  exec: mockScanExec,
} as unknown as ReturnType<typeof SubscriptionModel.scan>);

// get のモック実装: InputKey 型を引数に取るように修正
mockSubscriptionModel.get.mockImplementation(
  async (key: InputKey): Promise<Subscription | undefined> => {
    let sub_url: string | undefined;
    if (typeof key === "string") {
      // API実装は body.url (文字列) を渡すと想定
      sub_url = key;
    } else if (
      typeof key === "object" &&
      key !== null && // null チェック
      !(key instanceof Buffer) && // Bufferを除外
      "sub_url" in key &&
      typeof key.sub_url === "string"
    ) {
      // Dynamoose がオブジェクトキーを使う場合 ({sub_url: '...'})
      sub_url = key.sub_url;
    }
    // 他のキー型 (number, Buffer) はこのモデルでは想定しない

    if (sub_url) {
      // テストケース側で mockResolvedValueOnce/mockImplementationOnce を使う場合、この実装は上書きされる
      // 基本的なモック動作として、保持しているインスタンスを返す
      // 既存のインスタンスデータを保持しつつ、キーだけ更新する方が自然かもしれないが、
      // テストケースごとの beforeEach でリセットされるため、ここで sub_url を設定する
      mockSubscriptionInstance.sub_url = sub_url;
      // キャストは維持するが、MockSubscriptionInstance が Subscription の要件を満たす前提
      return mockSubscriptionInstance as unknown as Subscription;
    }
    return undefined; // キーが不正または見つからない場合
  },
);

// コンストラクタのモック: new SubscriptionModel(data) が呼ばれたときにモックインスタンスを返す
mockSubscriptionModel.mockImplementation((data: Partial<Subscription>) => {
  // data の内容をモックインスタンスにマージ (既存の save/delete は維持)
  const mergedData = { ...mockSubscriptionInstance, ...data };
  Object.assign(mockSubscriptionInstance, mergedData);
  // キャストは維持
  return mockSubscriptionInstance as unknown as Subscription;
});

describe("API Endpoints", () => {
  beforeEach(() => {
    // 各テストの前にモックの呼び出し履歴と状態をリセット
    vi.clearAllMocks();
    // モックインスタンスのプロパティを初期状態に戻す
    Object.assign(mockSubscriptionInstance, {
      sub_url: "",
      work_url: "",
      title: "",
      image: "",
      updated_at: 0,
      checked_at: undefined, // checked_at をリセット
      name: "",
      rank: 0,
      has_new: false,
      // save と delete はモック関数のまま
    });
  });

  it("GET / should return 200 with a welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Hello from root!" });
    // 重複行を削除
  });

  it("GET /subscriptions should return 200 and subscriptions", async () => {
    // mockScanExec に渡すデータは Subscription[] 型に合わせる
    const mockSubscriptions: Subscription[] = [
      {
        sub_url: "test.com",
        work_url: "work",
        title: "t",
        image: "i",
        updated_at: 1,
        name: "n",
        rank: 1,
        has_new: false,
        // Item のメソッドはモックでは不要な場合が多い
      } as Subscription, // キャストして型を明示
    ];
    // mockScanExec の戻り値をキャスト (関数シグネチャを渡す)
    (mockScanExec as Mock<() => Promise<Subscription[]>>).mockResolvedValueOnce(
      mockSubscriptions,
    );

    const response = await request(app).get("/subscriptions");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ subscriptions: mockSubscriptions });
    expect(mockSubscriptionModel.scan).toHaveBeenCalledTimes(1);
    expect(mockScanExec).toHaveBeenCalledTimes(1);
  });

  it("POST /subscriptions should return 200 and the created subscription", async () => {
    // APIへの入力データ。checked_at はオプショナルなので含めなくても良い
    const newSubscriptionData: Partial<Subscription> = {
      sub_url: "new.com",
      work_url: "work_new",
      title: "title_new",
      image: "image_new",
      updated_at: Date.now(),
      name: "name_new",
      rank: 2,
      // has_new はモデルのデフォルト値 (false) が使われる想定だが、明示しても良い
      // has_new: false
    };
    // new SubscriptionModel(data) のモックは設定済み
    // save のモックを設定 (Promise<void> を返す) (関数シグネチャを渡す)
    (mockSave as Mock<() => Promise<void>>).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post("/subscriptions")
      .send(newSubscriptionData);

    expect(response.status).toBe(200);
    // レスポンスには save/delete は含まれない
    // checked_at は undefined かもしれない
    // has_new はデフォルト値 false が設定されるはず
    const expectedResponse = {
      ...newSubscriptionData,
      // checked_at はオプショナルなので期待値から除外
      has_new: false, // モデルのデフォルト値
    };
    // checked_at を含まないオブジェクトと比較
    expect(response.body).toEqual(expect.objectContaining(expectedResponse));
    // 必要であれば、checked_at が存在しないことも確認できる
    // expect(response.body).not.toHaveProperty('checked_at');
    // コンストラクタの引数も確認
    expect(mockSubscriptionModel).toHaveBeenCalledWith(
      expect.objectContaining(newSubscriptionData),
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it("POST /subscriptions/patch should return 200 and the updated subscription", async () => {
    const patchDataRequest = { url: "existing.com", rank: 5, has_new: true };
    // モックの get が返す既存データ (MockSubscriptionInstance 型)
    const existingSubscriptionData: MockSubscriptionInstance = {
      sub_url: "existing.com",
      work_url: "w",
      title: "t",
      image: "i",
      updated_at: 1,
      checked_at: undefined,
      name: "n",
      rank: 1,
      has_new: false,
      save: mockSave,
      delete: mockDelete,
    };
    // get のモック: API から渡される url (文字列キー) をキーとして呼び出される
    // mockImplementationOnce を使う場合、型シグネチャは元の get と一致させる必要がある (関数シグネチャを渡す)
    (
      mockSubscriptionModel.get as Mock<
        (key: InputKey) => Promise<Subscription | undefined> // 関数シグネチャ
      >
    ).mockImplementationOnce(async (key: InputKey) => {
      // API実装は文字列キーを渡すと想定されるため、文字列で比較
      if (typeof key === "string" && key === patchDataRequest.url) {
        // 既存データを返す (キャストが必要)
        return existingSubscriptionData as unknown as Subscription;
      }
      return undefined;
    });
    // save のモックを設定 (関数シグネチャを渡す)
    (mockSave as Mock<() => Promise<void>>).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post("/subscriptions/patch")
      .send(patchDataRequest);

    expect(response.status).toBe(200);
    // レスポンスボディの期待値 (save/delete を除き、rank と has_new が更新されている)
    const expectedResponse = {
      sub_url: existingSubscriptionData.sub_url,
      work_url: existingSubscriptionData.work_url,
      title: existingSubscriptionData.title,
      image: existingSubscriptionData.image,
      updated_at: existingSubscriptionData.updated_at,
      // checked_at はオプショナルなので期待値から除外 (元データも undefined)
      name: existingSubscriptionData.name,
      rank: patchDataRequest.rank, // 更新された値
      has_new: patchDataRequest.has_new, // 更新された値
    };
    expect(response.body).toEqual(expect.objectContaining(expectedResponse));
    // get は API から渡される url で呼び出される
    expect(mockSubscriptionModel.get).toHaveBeenCalledWith(
      patchDataRequest.url,
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
    // モックインスタンスのプロパティが更新されていることを確認 (get が返したインスタンスが変更される想定)
    // 注意: get のモックが毎回新しいオブジェクトを返すと、この確認は失敗する。
    // 現在の実装では get はグローバルな mockSubscriptionInstance を返すため、変更が反映されるはず。
    // より堅牢にするには、get のモック内で返されるオブジェクトを捕捉して確認する。
    // ここでは、API実装が get で取得したインスタンスのプロパティを変更して save() すると仮定。
    // expect(existingSubscriptionData.rank).toBe(patchDataRequest.rank); // これはモックデータなので変更されない
    // expect(existingSubscriptionData.has_new).toBe(patchDataRequest.has_new); // これもモックデータなので変更されない
    // 代わりに save が呼ばれたことを確認する (上記で実施済み)
  });

  it("POST /subscriptions/patch should update only provided fields", async () => {
    const patchDataRequest = { url: "partial.com", has_new: true }; // rankは省略
    const existingSubscriptionData: MockSubscriptionInstance = {
      sub_url: "partial.com",
      work_url: "w",
      title: "t",
      image: "i",
      updated_at: 1,
      checked_at: undefined,
      name: "n",
      rank: 10, // 元の rank
      has_new: false, // 元の has_new
      save: mockSave,
      delete: mockDelete,
    };
    (
      mockSubscriptionModel.get as Mock<
        (key: InputKey) => Promise<Subscription | undefined> // 関数シグネチャ
      >
    ).mockImplementationOnce(async (key: InputKey) => {
      if (typeof key === "string" && key === patchDataRequest.url) {
        return existingSubscriptionData as unknown as Subscription;
      }
      return undefined;
    });
    (mockSave as Mock<() => Promise<void>>).mockResolvedValueOnce(undefined); // 関数シグネチャ

    const response = await request(app)
      .post("/subscriptions/patch")
      .send(patchDataRequest);

    expect(response.status).toBe(200);
    // レスポンスボディの期待値 (has_new のみ更新、rank は元のまま)
    const expectedResponse = {
      sub_url: existingSubscriptionData.sub_url,
      work_url: existingSubscriptionData.work_url,
      title: existingSubscriptionData.title,
      image: existingSubscriptionData.image,
      updated_at: existingSubscriptionData.updated_at,
      // checked_at はオプショナルなので期待値から除外 (元データも undefined)
      name: existingSubscriptionData.name,
      rank: existingSubscriptionData.rank, // 元の値
      has_new: patchDataRequest.has_new, // 更新された値
    };
    expect(response.body).toEqual(expect.objectContaining(expectedResponse));
    expect(mockSubscriptionModel.get).toHaveBeenCalledWith(
      patchDataRequest.url,
    );
    expect(mockSave).toHaveBeenCalledTimes(1);
    // save が呼ばれたことを確認 (上記で実施済み)
  });

  it("POST /subscriptions/delete should return 204", async () => {
    const deleteDataRequest = { url: "delete.com" };
    const existingSubscriptionData: MockSubscriptionInstance = {
      sub_url: "delete.com",
      work_url: "w",
      title: "t",
      image: "i",
      updated_at: 1,
      checked_at: undefined,
      name: "n",
      rank: 1,
      has_new: false,
      save: mockSave,
      delete: mockDelete,
    };
    (
      mockSubscriptionModel.get as Mock<
        (key: InputKey) => Promise<Subscription | undefined> // 関数シグネチャ
      >
    ).mockImplementationOnce(async (key: InputKey) => {
      if (typeof key === "string" && key === deleteDataRequest.url) {
        return existingSubscriptionData as unknown as Subscription;
      }
      return undefined;
    });
    // delete のモックを設定 (関数シグネチャを渡す)
    (mockDelete as Mock<() => Promise<void>>).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post("/subscriptions/delete")
      .send(deleteDataRequest);

    expect(response.status).toBe(204);
    expect(mockSubscriptionModel.get).toHaveBeenCalledWith(
      deleteDataRequest.url,
    );
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("GET /non-existent-path should return 404", async () => {
    const response = await request(app).get("/non-existent-path");
    expect(response.status).toBe(404);
    // API実装によってはエラーレスポンスの形式が異なる可能性がある
    expect(response.body).toEqual({ error: "Not Found" });
  });
});
