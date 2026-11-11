# Muse inbox（むぎからの記録の受け取り口）

`data/muse-inbox.json` は、Muse（むぎ）がチャットで受けた食事・運動・体重の報告を
アプリへ届けるためのファイルです。アプリは起動時と、画面に戻ってきたとき（5分間隔）
にこのファイルを読み、未取り込みのレコードだけを該当日の記録へマージします。

## ルール

- 各レコードは一意な `id`（UUID）を持つ。取り込み済み id は端末側に保存され、二重取り込みしない。
- 食事・運動のアイテム id は `muse-<record id>` になる。アプリ側でそのアイテムを削除した場合、
  取り込み済み id が残るため再取り込みはされない（削除が尊重される）。
- 体重（`weightMorning`）は、その日に朝の体重がまだ無い場合だけ入る。端末の手入力が優先。
- レコードは追記のみで運用する（過去分を書き換えない）。

## 形式

```json
{
  "version": 1,
  "records": [
    { "id": "uuid", "date": "2026-11-09", "type": "meal", "meal": "lunch",
      "item": { "name": "鶏むね野菜煮込み丼", "amount": "ご飯200g",
                "calories": 650, "protein": 45, "fat": 12, "carbs": 90 },
      "note": "任意のメモ" },
    { "id": "uuid", "date": "2026-11-11", "type": "exercise",
      "exercise": { "name": "自宅トレA（上半身＋体幹）", "minutes": 30, "burnCalories": 135 } },
    { "id": "uuid", "date": "2026-11-11", "type": "weight", "weightMorning": 69.8 }
  ]
}
```

`meal` は `breakfast | lunch | dinner | snack` のいずれか。
